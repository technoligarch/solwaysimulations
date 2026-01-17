export class OrchestrationEngine {
  constructor(agents, scenario, initialPrompt, apiClients) {
    this.agents = agents; // Array of agent configs with { id, name, model, provider, systemPrompt, color }
    this.scenario = scenario;
    this.initialPrompt = initialPrompt;
    this.apiClients = apiClients;
    this.transcript = [];
    this.isRunning = false;
    this.currentTurnIndex = 0;
    this.godModeQueue = [];
  }

  async start() {
    this.isRunning = true;
    this.currentTurnIndex = 0;

    // Add the initial system message
    this.addMessageToTranscript({
      sender: 'system',
      content: `Scenario: ${this.scenario}`,
      timestamp: new Date()
    });

    this.addMessageToTranscript({
      sender: 'system',
      content: this.initialPrompt,
      timestamp: new Date()
    });

    // Start the autonomous loop
    await this.orchestrationLoop();
  }

  stop() {
    this.isRunning = false;
  }

  async orchestrationLoop() {
    while (this.isRunning) {
      // Check for God Mode prompts
      if (this.godModeQueue.length > 0) {
        const godPrompt = this.godModeQueue.shift();
        this.addMessageToTranscript({
          sender: 'god',
          content: godPrompt,
          timestamp: new Date()
        });
        global.broadcastToSession(this.sessionId, {
          type: 'message',
          data: this.transcript[this.transcript.length - 1]
        });
      }

      // Round-robin: each agent takes a turn
      const agent = this.agents[this.currentTurnIndex % this.agents.length];

      try {
        const response = await this.getAgentResponse(agent);

        this.addMessageToTranscript({
          sender: agent.id,
          senderName: agent.name,
          senderColor: agent.color,
          content: response,
          timestamp: new Date()
        });

        // Broadcast the new message to all connected clients
        global.broadcastToSession(this.sessionId, {
          type: 'message',
          data: this.transcript[this.transcript.length - 1]
        });

        this.currentTurnIndex++;

        // Add a small delay between messages for readability
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error getting response from ${agent.name}:`, error);
        this.addMessageToTranscript({
          sender: 'system',
          content: `[Error: ${agent.name} failed to respond]`,
          timestamp: new Date()
        });
      }
    }
  }

  async getAgentResponse(agent) {
    const provider = agent.provider.toLowerCase();
    const conversationHistory = this.buildConversationHistory();
    const systemPrompt = agent.systemPrompt;

    if (provider === 'openai') {
      return await this.getOpenAIResponse(agent, conversationHistory, systemPrompt);
    } else if (provider === 'anthropic') {
      return await this.getAnthropicResponse(agent, conversationHistory, systemPrompt);
    } else if (provider === 'google') {
      return await this.getGoogleResponse(agent, conversationHistory, systemPrompt);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  async getOpenAIResponse(agent, conversationHistory, systemPrompt) {
    const client = this.apiClients.openai;
    if (!client) throw new Error('OpenAI client not configured');

    const response = await client.chat.completions.create({
      model: agent.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  }

  async getAnthropicResponse(agent, conversationHistory, systemPrompt) {
    const client = this.apiClients.anthropic;
    if (!client) throw new Error('Anthropic client not configured');

    const response = await client.messages.create({
      model: agent.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      system: systemPrompt,
      messages: conversationHistory,
    });

    return response.content[0].text.trim();
  }

  async getGoogleResponse(agent, conversationHistory, systemPrompt) {
    const client = this.apiClients.google;
    if (!client) throw new Error('Google client not configured');

    const model = client.getGenerativeModel({
      model: agent.model || 'gemini-1.5-pro',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const response = await chat.sendMessage(
      conversationHistory.length > 0
        ? 'Continue the conversation naturally.'
        : 'Start the conversation naturally.'
    );

    return response.response.text().trim();
  }

  buildConversationHistory() {
    return this.transcript
      .filter(msg => msg.sender !== 'system')
      .slice(-20) // Keep last 20 messages for context window
      .map(msg => {
        let role = 'user';
        if (msg.sender === 'god') role = 'user';
        else if (msg.sender !== 'system') role = 'assistant';

        return {
          role,
          content: `${msg.senderName || msg.sender}: ${msg.content}`
        };
      });
  }

  addMessageToTranscript(message) {
    this.transcript.push(message);
  }

  injectGodModePrompt(prompt) {
    this.godModeQueue.push(prompt);
  }

  getTranscript() {
    return this.transcript;
  }

  exportTranscript(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.transcript, null, 2);
    } else if (format === 'txt') {
      return this.transcript
        .map(msg => `[${msg.senderName || msg.sender}]: ${msg.content}`)
        .join('\n\n');
    }
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
}
