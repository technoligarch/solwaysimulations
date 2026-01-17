export class OrchestrationEngine {
  constructor(agents, scenario, initialPrompt, openRouterClient) {
    this.agents = agents;
    this.scenario = scenario;
    this.initialPrompt = initialPrompt;
    this.openRouterClient = openRouterClient;
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

    // Initial Context
    this.addMessageToTranscript({
      sender: 'system',
      senderName: 'System',
      content: `SCENARIO: ${this.scenario}\nINITIAL TOPIC: ${this.initialPrompt}`,
      timestamp: new Date()
    });

    this.broadcastMessage(this.transcript[0]);

    await this.orchestrationLoop();
  }

  stop() {
    this.isRunning = false;
  }

  async orchestrationLoop() {
    while (this.isRunning) {
      // 1. Check for God Mode (User Injections)
      if (this.godModeQueue.length > 0) {
        const godPrompt = this.godModeQueue.shift();
        const godMsg = {
          sender: 'god',
          senderName: 'God Mode',
          senderColor: '#FFD700', // Gold
          content: godPrompt,
          timestamp: new Date()
        };
        this.addMessageToTranscript(godMsg);
        this.broadcastMessage(godMsg);
      }

      // 2. Select Speaker
      const agent = this.agents[this.currentTurnIndex % this.agents.length];

      try {
        // 3. Get Response
        const responseText = await this.getAgentResponse(agent);

        const newMessage = {
          sender: agent.id,
          senderName: agent.name,
          senderColor: agent.color,
          content: responseText,
          timestamp: new Date()
        };

        this.addMessageToTranscript(newMessage);
        this.broadcastMessage(newMessage);

        this.currentTurnIndex++;

        // 3 Second Delay (as requested)
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`Error getting response from ${agent.name}:`, error);
        // Skip turn on error so the whole app doesn't freeze
        this.currentTurnIndex++; 
      }
    }
  }

  async getAgentResponse(agent) {
    const modelId = this.resolveOpenRouterModelId(agent.model);
    
    // --- THE FIX IS HERE ---
    // Instead of sending raw messages, we compile a clean "Transcript" string.
    // This prevents the AI from confusing other agents' messages with its own instructions.
    
    const otherAgents = this.agents.filter(a => a.id !== agent.id).map(a => a.name).join(", ");
    
    const recentHistory = this.transcript
      .slice(-10) // Only look at last 10 lines to keep focus sharp
      .map(msg => `${msg.senderName.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    // We construct one massive "Prompt" that contains everything.
    // This is safer than the 'messages' array for Multi-Agent consistency.
    const prompt = `
You are ${agent.name}.
Your personality/instructions: ${agent.systemPrompt}

You are in a group chat with: ${otherAgents}.
The current scenario is: ${this.scenario}.

BELOW IS THE CHAT TRANSCRIPT SO FAR.
Read it, then write YOUR response to the group.
DO NOT write lines for other people. Only write the text for ${agent.name}.

--- TRANSCRIPT START ---
${recentHistory}
--- TRANSCRIPT END ---

(It is now ${agent.name}'s turn. Respond naturally to the last message. Keep it under 2 sentences.)
    `.trim();

    const completion = await this.openRouterClient.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'user', content: prompt } // We send it all as one "User" block
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    // Cleanup: Sometimes models reply "Grok: Hey guys." We want to remove the "Grok:" prefix.
    let cleanContent = completion.choices[0].message.content.trim();
    if (cleanContent.startsWith(agent.name + ":")) {
        cleanContent = cleanContent.replace(agent.name + ":", "").trim();
    }
    return cleanContent;
  }

  resolveOpenRouterModelId(inputModel) {
    const model = inputModel.toLowerCase();
    if (model.includes('/')) return model;
    if (model.includes('gpt-4')) return 'openai/gpt-4o';
    if (model.includes('claude')) return 'anthropic/claude-3-haiku';
    if (model.includes('gemini')) return 'google/gemini-1.5-flash';
    if (model.includes('grok')) return 'x-ai/grok-2-1212';
    return 'openai/gpt-4o';
  }

  addMessageToTranscript(message) {
    this.transcript.push(message);
  }

  broadcastMessage(message) {
    if (this.sessionId && global.broadcastToSession) {
      global.broadcastToSession(this.sessionId, {
        type: 'message',
        data: message
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