export class OrchestrationEngine {
  constructor(agents, scenario, initialPrompt, apiClients, toolbox) {
    this.agents = agents;
    this.scenario = scenario;
    this.initialPrompt = initialPrompt;
    this.apiClients = apiClients;
    this.toolbox = toolbox;
    this.transcript = [];
    this.isRunning = false;
    this.currentTurnIndex = 0;
    this.godModeQueue = [];
    this.sessionId = null;
    this.agentStatuses = {};

    agents.forEach(agent => {
      this.agentStatuses[agent.id] = null;
    });
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  async start() {
    this.isRunning = true;
    this.currentTurnIndex = 0;

    this.addMessageToTranscript({
      type: 'system_message',
      senderName: 'System',
      content: `SCENARIO: ${this.scenario}\nINITIAL TOPIC: ${this.initialPrompt}`,
      timestamp: new Date()
    });

    await this.orchestrationLoop();
  }

  stop() {
    this.isRunning = false;
  }

  async orchestrationLoop() {
    while (this.isRunning) {
      // Handle God Mode prompts
      if (this.godModeQueue.length > 0) {
        const godPrompt = this.godModeQueue.shift();
        const godMsg = {
          type: 'god_mode',
          senderName: 'God Mode',
          content: godPrompt,
          timestamp: new Date()
        };
        this.addMessageToTranscript(godMsg);
        global.broadcastToSession(this.sessionId, {
          type: 'message',
          data: godMsg
        });
      }

      // Select current agent
      const agent = this.agents[this.currentTurnIndex % this.agents.length];
      console.log(`\n--- Turn ${this.currentTurnIndex + 1}: ${agent.name}'s turn ---`);

      this.updateAgentStatus(agent.id, 'thinking');
      this.broadcastStatus();

      try {
        // STEP 1: THINK PHASE
        console.log(`[${agent.name}] is thinking...`);
        const thinkResponse = await this.runThinkPhase(agent);

        let toolResult = null;
        let toolUsed = null;

        // STEP 2: ACT PHASE
        if (thinkResponse.action && thinkResponse.action.tool_name) {
          toolUsed = thinkResponse.action.tool_name;
          console.log(`[${agent.name}] is using tool: ${toolUsed}`);
          this.updateAgentStatus(agent.id, `using ${toolUsed}`);
          this.broadcastStatus();

          toolResult = await this.executeTool(
            thinkResponse.action.tool_name,
            thinkResponse.action.tool_input
          );

          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`[${agent.name}] chose not to use a tool.`);
        }

        // STEP 3: SPEAK PHASE
        console.log(`[${agent.name}] is speaking...`);
        this.updateAgentStatus(agent.id, 'speaking');
        this.broadcastStatus();

        const publicMessage = await this.runSpeakPhase(agent, thinkResponse.thought, toolResult);

        // Record the full turn
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
        global.broadcastToSession(this.sessionId, {
          type: 'message',
          data: newTurnData
        });

        this.updateAgentStatus(agent.id, null);
        this.broadcastStatus();

        this.currentTurnIndex++;
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[OrchestrationEngine] Error during ${agent.name}'s turn:`, error);
        const errorMsg = {
          type: 'error',
          senderName: 'System',
          content: `[Error: ${agent.name} failed its turn. Skipping ahead.]`,
          timestamp: new Date()
        };
        this.addMessageToTranscript(errorMsg);
        global.broadcastToSession(this.sessionId, {
          type: 'message',
          data: errorMsg
        });
        this.updateAgentStatus(agent.id, null);
        this.broadcastStatus();
        this.currentTurnIndex++;
      }
    }
  }

  async runThinkPhase(agent) {
    const history = this.buildConversationHistory();
    const thinkPrompt = `Based on the conversation history, what is your private thought and what action will you take? You have access to one tool: search(query) to search the web for current information. If you don't need to search, set 'action' to null. Respond ONLY with valid JSON.`;

    const response = await this.getAgentResponse(agent, [
      ...history,
      { role: 'user', content: thinkPrompt },
    ]);

    try {
      return JSON.parse(response);
    } catch (e) {
      console.error(`[${agent.name}] Failed to parse think phase JSON`);
      return {
        thought: response,
        action: null
      };
    }
  }

  async runSpeakPhase(agent, privateThought, toolResult) {
    const history = this.buildConversationHistory();
    const speakPrompt = toolResult
      ? `Your private thought was: "${privateThought}". Based on your research, respond to the conversation naturally.`
      : `Your private thought was: "${privateThought}". Now respond to the conversation.`;

    const response = await this.getAgentResponse(agent, [
      ...history,
      { role: 'user', content: speakPrompt },
    ]);

    return response.trim();
  }

  async executeTool(toolName, toolInput) {
    if (toolName === 'search' && this.toolbox.search) {
      return await this.toolbox.search(toolInput);
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }

  async getAgentResponse(agent, messages) {
    const provider = agent.provider.toLowerCase();

    if (provider === 'openai') {
      return await this.getOpenAIResponse(agent, messages);
    } else if (provider === 'anthropic') {
      return await this.getAnthropicResponse(agent, messages);
    } else if (provider === 'google') {
      return await this.getGoogleResponse(agent, messages);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  async getOpenAIResponse(agent, messages) {
    const client = this.apiClients.openai;
    if (!client) throw new Error('OpenAI client not configured');

    const response = await client.chat.completions.create({
      model: agent.model || 'gpt-4o',
      messages: [
        { role: 'system', content: agent.systemPrompt },
        ...messages,
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    return response.choices[0].message.content;
  }

  async getAnthropicResponse(agent, messages) {
    const client = this.apiClients.anthropic;
    if (!client) throw new Error('Anthropic client not configured');

    const response = await client.messages.create({
      model: agent.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      system: agent.systemPrompt,
      messages: messages,
    });

    return response.content[0].text;
  }

  async getGoogleResponse(agent, messages) {
    const client = this.apiClients.google;
    if (!client) throw new Error('Google client not configured');

    const model = client.getGenerativeModel({
      model: agent.model || 'gemini-1.5-pro',
      systemInstruction: agent.systemPrompt,
    });

    const chat = model.startChat({
      history: messages
        .filter(m => m.role !== 'system')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
    });

    const lastMessage = messages[messages.length - 1]?.content || 'Continue naturally.';
    const response = await chat.sendMessage(lastMessage);

    return response.response.text();
  }

  buildConversationHistory() {
    return this.transcript
      .filter(msg => msg.type !== 'system_message')
      .slice(-15)
      .map(msg => {
        let content = '';
        if (msg.type === 'agent_turn') {
          content = `${msg.senderName}: ${msg.publicMessage}`;
        } else if (msg.type === 'god_mode') {
          content = `[${msg.senderName}]: ${msg.content}`;
        } else {
          content = msg.content;
        }

        return {
          role: msg.type === 'agent_turn' ? 'assistant' : 'user',
          content: content
        };
      });
  }

  addMessageToTranscript(message) {
    this.transcript.push(message);
  }

  injectGodModePrompt(prompt) {
    this.godModeQueue.push(prompt);
  }

  updateAgentStatus(agentId, status) {
    this.agentStatuses[agentId] = status;
  }

  broadcastStatus() {
    global.broadcastToSession(this.sessionId, {
      type: 'status_update',
      data: this.agentStatuses
    });
  }

  getTranscript() {
    return this.transcript;
  }

  getAgentStatuses() {
    return this.agentStatuses;
  }

  exportTranscript(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.transcript, null, 2);
    } else if (format === 'txt') {
      return this.transcript
        .map(msg => {
          if (msg.type === 'agent_turn') {
            let text = `[${msg.senderName}]: ${msg.publicMessage}`;
            if (msg.privateThought) {
              text += `\n  └─ Thought: ${msg.privateThought}`;
            }
            if (msg.toolUsed) {
              text += `\n  └─ Used: ${msg.toolUsed}`;
            }
            return text;
          } else {
            return `[${msg.senderName}]: ${msg.content}`;
          }
        })
        .join('\n\n');
    }
  }
}
