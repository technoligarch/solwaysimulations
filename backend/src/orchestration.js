export class OrchestrationEngine {
  constructor(agents, scenario, initialPrompt, openRouterClient, toolbox) {
    this.agents = agents;
    this.scenario = scenario;
    this.initialPrompt = initialPrompt;
    this.openRouterClient = openRouterClient;
    this.toolbox = toolbox; // V2: Toolbox with functions like search()
    this.transcript = [];
    this.isRunning = false;
    this.currentTurnIndex = 0;
    this.godModeQueue = [];
    this.sessionId = null;
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  async start() {
    this.isRunning = true;
    this.currentTurnIndex = 0;

    // Add the initial system message to the transcript
    const initialMessage = {
      type: 'system_message',
      senderName: 'System',
      content: `SCENARIO: ${this.scenario}\nINITIAL TOPIC: ${this.initialPrompt}`,
      timestamp: new Date()
    };
    this.addMessageToTranscript(initialMessage);
    this.broadcastMessage(initialMessage);

    // Start the autonomous loop
    await this.orchestrationLoop();
  }

  stop() {
    this.isRunning = false;
  }

  // =================================================================
  // V2 CORE LOGIC: THINK -> ACT -> SPEAK CYCLE
  // =================================================================

  async orchestrationLoop() {
    while (this.isRunning) {
      // 1. Handle any user-injected "God Mode" prompts first
      if (this.godModeQueue.length > 0) {
        const godPrompt = this.godModeQueue.shift();
        const godMsg = { 
            type: 'god_mode',
            senderName: 'God Mode', 
            content: godPrompt,
            timestamp: new Date()
        };
        this.addMessageToTranscript(godMsg);
        this.broadcastMessage(godMsg);
      }

      // 2. Select the current agent
      const agent = this.agents[this.currentTurnIndex % this.agents.length];
      console.log(`\n--- Turn ${this.currentTurnIndex + 1}: ${agent.name}'s turn ---`);
      
      this.broadcastStatus(agent.id, 'thinking');

      try {
        // STEP 1: THINK PHASE (Generate private thought and action plan)
        console.log(`[${agent.name}] is thinking...`);
        const thinkResponse = await this.runThinkPhase(agent);
        
        let toolResult = null;
        let toolUsed = null;

        // STEP 2: ACT PHASE (Execute a tool, if planned)
        if (thinkResponse.action && thinkResponse.action.tool_name) {
          toolUsed = thinkResponse.action.tool_name;
          console.log(`[${agent.name}] is acting with tool: ${toolUsed}`);
          this.broadcastStatus(agent.id, `using ${toolUsed}`);

          toolResult = await this.executeTool(
            thinkResponse.action.tool_name,
            thinkResponse.action.tool_input
          );
        } else {
          console.log(`[${agent.name}] chose not to use a tool.`);
        }

        // STEP 3: SPEAK PHASE (Generate public message based on new info)
        console.log(`[${agent.name}] is speaking...`);
        this.broadcastStatus(agent.id, 'speaking');
        const publicMessage = await this.runSpeakPhase(agent, thinkResponse.thought, toolResult);

        // 4. Record the full turn and broadcast it
        const newTurnData = {
          type: 'agent_turn',
          senderId: agent.id,
          senderName: agent.name,
          senderColor: agent.color,
          publicMessage: publicMessage,
          privateThought: thinkResponse.thought,
          toolUsed: toolUsed,
          toolResult: toolResult,
          timestamp: new Date(),
        };

        this.addMessageToTranscript(newTurnData);
        this.broadcastMessage(newTurnData);

        this.currentTurnIndex++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay

      } catch (error) {
        console.error(`[OrchestrationEngine] Critical error during ${agent.name}'s turn:`, error);
        const errorMsg = {
          type: 'error',
          senderName: 'System',
          content: `[Error: ${agent.name} failed its turn. Skipping ahead.]`,
        };
        this.addMessageToTranscript(errorMsg);
        this.broadcastMessage(errorMsg);
        this.currentTurnIndex++; // Skip the broken agent's turn
      }
    }
  }

  /**
   * Asks the LLM to generate a private thought and an action plan.
   * Must return a JSON object with "thought" and "action".
   */
  async runThinkPhase(agent) {
    const history = this.buildConversationHistory();
    const thinkPrompt = `Based on the conversation history, what is your private thought and what action will you take? You have one tool available: search(query). If you don't need a tool, set 'action' to null. Respond ONLY with a valid JSON object.`;
    
    const response = await this.openRouterClient.chat.completions.create({
      model: this.resolveOpenRouterModelId(agent.model),
      messages: [
        { role: 'system', content: agent.systemPrompt },
        ...history,
        { role: 'user', content: thinkPrompt },
      ],
      response_format: { type: 'json_object' },
    });
    
    const rawJSON = response.choices[0].message.content;
    try {
      return JSON.parse(rawJSON);
    } catch (e) {
      console.error("Failed to parse JSON from think phase:", rawJSON);
      return { thought: "I failed to think correctly and output valid JSON.", action: null };
    }
  }

  /**
   * Executes a tool from the toolbox.
   */
  async executeTool(toolName, toolInput) {
    if (this.toolbox[toolName]) {
      return await this.toolbox[toolName](toolInput);
    }
    return `Error: Tool "${toolName}" not found.`;
  }

  /**
   * Asks the LLM to generate a public message based on its thoughts and tool results.
   */
  async runSpeakPhase(agent, thought, toolResult) {
    const history = this.buildConversationHistory();
    let speakPrompt = `Your private thought was: "${thought}".\n`;
    if (toolResult) {
      speakPrompt += `You used a tool and got this result: "${toolResult}".\n`;
    }
    speakPrompt += `Based on this, what do you say out loud to the group? Keep it concise (1-2 sentences).`;

    const response = await this.openRouterClient.chat.completions.create({
      model: this.resolveOpenRouterModelId(agent.model),
      messages: [
        { role: 'system', content: agent.systemPrompt },
        ...history,
        { role: 'user', content: speakPrompt },
      ],
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Builds the conversation history for the LLM context.
   */
  buildConversationHistory() {
    return this.transcript
      .filter(msg => msg.type === 'agent_turn' || msg.type === 'god_mode') // Agents should remember God Mode prompts
      .slice(-20) // AGENT MEMORY: Increased to 20 turns as requested
      .map(msg => ({
        role: 'user', // Treat all past messages as user input for context
        content: `${msg.senderName}: ${msg.publicMessage || msg.content}`,
      }));
  }
  
  resolveOpenRouterModelId(inputModel) {
    const model = inputModel.toLowerCase();
    if (model.includes('/')) return model;
    if (model.includes('gpt-4')) return 'openai/gpt-4o';
    if (model.includes('claude')) return 'anthropic/claude-3-haiku';
    if (model.includes('gemini')) return 'google/gemini-1.5-flash';
    if (model.includes('grok')) return 'x-ai/grok-2-1212';
    return 'openai/gpt-4o'; // Default fallback
  }

  addMessageToTranscript(message) {
    this.transcript.push(message);
  }

  broadcastMessage(message) {
    if (this.sessionId && global.broadcastToSession) {
      global.broadcastToSession(this.sessionId, {
        type: 'message', // This might need to be more specific later
        data: message
      });
    }
  }
  
  broadcastStatus(agentId, status) {
    if (this.sessionId && global.broadcastToSession) {
      global.broadcastToSession(this.sessionId, {
        type: 'status_update',
        data: { agentId, status }
      });
    }
  }

  injectGodModePrompt(prompt) {
    this.godModeQueue.push(prompt);
  }

  getTranscript() {
    return this.transcript;
  }
}
