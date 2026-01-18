export class OrchestrationEngine {
  constructor(agents, scenario, initialPrompt, apiClients, toolbox) {
    this.agents = agents; 
    this.scenario = scenario;
    this.initialPrompt = initialPrompt;
    this.apiClients = apiClients; 
    this.toolbox = toolbox; // Contains web_search definition and execution logic
    
    this.sessionId = null;
    this.isRunning = false;
    this.transcript = [];
    this.agentStatuses = {}; 
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  getTranscript() {
    return this.transcript;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`Starting session ${this.sessionId}`);
    
    if (this.transcript.length === 0) {
      this.addSystemMessage(`Scenario: ${this.scenario}\nPrompt: ${this.initialPrompt}`);
    }

    this.runLoop();
  }

  stop() {
    this.isRunning = false;
    console.log(`Stopping session ${this.sessionId}`);
  }

  async runLoop() {
    let turnIndex = 0;

    while (this.isRunning) {
      const currentAgent = this.agents[turnIndex % this.agents.length];
      
      try {
        await this.handleAgentTurn(currentAgent);
      } catch (error) {
        console.error(`Error in turn for ${currentAgent.name}:`, error);
      }

      turnIndex++;
      
      if (this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }
  }

  async handleAgentTurn(agent) {
    this.updateStatus(agent.id, 'thinking'); 
    
    const messages = this.buildPrompt(agent);
    const client = this.apiClients.openrouter;
    const model = agent.model || 'openai/gpt-4o';

    // Prepare tools for the LLM
    const tools = Object.values(this.toolbox).map(t => t.definition);

    try {
      // 1. First Call: Ask LLM (providing tools)
      const completion = await client.chat.completions.create({
        model: model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto', // Let the AI decide if it needs to search
      });

      const message = completion.choices[0].message;
      let finalContent = message.content;
      let toolData = null;

      // 2. Check if the AI wants to use a tool (Act Phase)
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0]; // Handle the first tool call
        const functionName = toolCall.function.name;
        
        // Update status to show user we are searching
        this.updateStatus(agent.id, 'acting'); // "Acting" = Searching
        console.log(`${agent.name} is calling tool: ${functionName}`);

        if (this.toolbox[functionName]) {
          // Execute the tool (Tavily Search)
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await this.toolbox[functionName].execute(args);

          // Save tool info to display in frontend later
          toolData = {
            name: functionName,
            query: args.query,
            result: toolResult
          };

          // 3. Second Call: Feed results back to LLM to get the speech
          // Add the tool usage history to the messages
          messages.push(message); 
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult
          });

          // Ask for the final response based on the search results
          const secondCompletion = await client.chat.completions.create({
            model: model,
            messages: messages,
          });

          finalContent = secondCompletion.choices[0].message.content;
        }
      }
      
      this.updateStatus(agent.id, 'speaking');
      
      // 4. Speak Phase (Send message + tool data if it exists)
      this.addAgentMessage(agent, finalContent, null, toolData);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.updateStatus(agent.id, null); 

    } catch (err) {
      console.error(`LLM Call failed for ${agent.name}:`, err);
      this.updateStatus(agent.id, 'error');
    }
  }

  addAgentMessage(agent, text, thought = null, toolInfo = null) {
    // Format tool data for the frontend
    let toolUsedName = null;
    let toolResultObj = null;

    if (toolInfo) {
      toolUsedName = toolInfo.name;
      // The frontend expects { answer: ..., results: ... } or just a string
      // Our tool returns a string, so we wrap it nicely
      toolResultObj = {
        answer: `Searched for: "${toolInfo.query}"`,
        results: [{ title: 'Search Result', title: toolInfo.result }] // simplified for display
      };
    }

    const msg = {
      id: Date.now(),
      type: 'agent_turn',          
      senderName: agent.name,
      senderColor: agent.color,    
      publicMessage: text,         
      privateThought: thought,
      toolUsed: toolUsedName,      // "web_search"
      toolResult: toolResultObj,   // The actual search text
      timestamp: new Date().toISOString()
    };

    this.transcript.push(msg);
    this.broadcast('message', msg);
  }

  addSystemMessage(content) {
    const msg = {
      id: Date.now(),
      type: 'system_message',      
      content: content,
      timestamp: new Date().toISOString()
    };
    this.transcript.push(msg);
    this.broadcast('message', msg);
  }

  injectGodModePrompt(prompt) {
    const msg = {
      id: Date.now(),
      type: 'god_mode',            
      content: prompt,
      timestamp: new Date().toISOString()
    };
    this.transcript.push(msg);
    this.broadcast('message', msg);
  }

  buildPrompt(agent) {
    const systemMsg = {
      role: 'system',
      content: `You are ${agent.name}. ${agent.systemPrompt}
      
      Current Scenario: ${this.scenario}
      Original Topic: ${this.initialPrompt}
      
      IMPORTANT RULES:
      1. Keep response to 10-20 words maximum.
      2. If you need current facts or news to win an argument, USE THE web_search TOOL.
      3. If the Director gives an instruction, obey immediately.`
    };

    const history = this.transcript
      .filter(t => t.type === 'agent_turn' || t.type === 'god_mode') 
      .map(t => {
        if (t.type === 'god_mode') {
          return {
            role: 'system',
            content: `[DIRECTOR INSTRUCTION]: ${t.content} (IGNORE PREVIOUS TOPIC, ADDRESS THIS NOW)` 
          };
        }
        return {
          role: 'user', 
          content: `${t.senderName}: ${t.publicMessage}`
        };
      });

    return [systemMsg, ...history];
  }

  updateStatus(agentId, status) {
    this.agentStatuses[agentId] = status;
    this.broadcast('status_update', this.agentStatuses);
  }

  broadcast(type, data) {
    if (global.broadcastToSession) {
      global.broadcastToSession(this.sessionId, { type, data });
    }
  }
}