import Anthropic from '@anthropic-ai/sdk';

/**
 * AnthropicAgentRunner - Runs Claude models with native agentic loop
 *
 * Features:
 * - Multi-step tool use (agent runs until it produces final text)
 * - Native Anthropic tool_use / tool_result handling
 * - Compatible with existing toolbox format
 */
export class AnthropicAgentRunner {
  constructor(toolbox, options = {}) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('Warning: ANTHROPIC_API_KEY not set. Anthropic agent calls will fail.');
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'missing-key',
    });
    this.toolbox = toolbox || {};
    this.maxIterations = options.maxIterations || 10;
    this.onToolUse = options.onToolUse || null; // Callback for tool use events
    this.onThinking = options.onThinking || null; // Callback for thinking events
  }

  /**
   * Convert toolbox format to Anthropic tool format
   */
  getAnthropicTools() {
    return Object.entries(this.toolbox).map(([name, tool]) => ({
      name: tool.definition.function.name,
      description: tool.definition.function.description,
      input_schema: {
        type: 'object',
        properties: tool.definition.function.parameters.properties,
        required: tool.definition.function.parameters.required || [],
      },
    }));
  }

  /**
   * Execute a tool and return the result
   */
  async executeTool(toolName, toolInput) {
    const tool = this.toolbox[toolName];
    if (!tool) {
      return { error: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await tool.execute(toolInput);
      return { result };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Run the agentic loop for a single agent turn
   *
   * @param {Object} agent - The agent configuration
   * @param {string} systemPrompt - The full system prompt
   * @param {Array} messages - Conversation history in Anthropic format
   * @returns {Object} - { text, toolsUsed: [{ name, input, result }] }
   */
  async run(agent, systemPrompt, messages) {
    const model = this.getModelId(agent.model);
    const tools = this.getAnthropicTools();
    const toolsUsed = [];

    let currentMessages = [...messages];
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      // Make API call
      const response = await this.client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: tools.length > 0 ? tools : undefined,
        messages: currentMessages,
      });

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Agent is done - extract text response
        const textBlock = response.content.find(block => block.type === 'text');
        return {
          text: textBlock?.text || '',
          toolsUsed,
        };
      }

      if (response.stop_reason === 'tool_use') {
        // Agent wants to use tools
        const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

        // Add assistant's response to messages
        currentMessages.push({
          role: 'assistant',
          content: response.content,
        });

        // Execute each tool and collect results
        const toolResults = [];

        for (const toolUse of toolUseBlocks) {
          // Notify callback if provided
          if (this.onToolUse) {
            this.onToolUse(toolUse.name, toolUse.input);
          }

          const { result, error } = await this.executeTool(toolUse.name, toolUse.input);

          const toolResult = {
            name: toolUse.name,
            input: toolUse.input,
            result: error || result,
            isError: !!error,
          };

          toolsUsed.push(toolResult);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: error || result,
            is_error: !!error,
          });
        }

        // Add tool results to messages
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop
        continue;
      }

      // Unexpected stop reason - return what we have
      const textBlock = response.content.find(block => block.type === 'text');
      return {
        text: textBlock?.text || '',
        toolsUsed,
      };
    }

    // Max iterations reached
    return {
      text: '[Agent reached maximum tool iterations]',
      toolsUsed,
    };
  }

  /**
   * Map model strings to Anthropic model IDs
   */
  getModelId(modelString) {
    // Handle various model string formats
    // Use known-working model IDs
    const modelMap = {
      'anthropic/claude-3-opus': 'claude-3-opus-20240229',
      'anthropic/claude-3-sonnet': 'claude-3-sonnet-20240229',
      'anthropic/claude-3-haiku': 'claude-3-haiku-20240307',
      'anthropic/claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
      'anthropic/claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'anthropic/claude-3.5-haiku': 'claude-3-5-haiku-20241022',
      'anthropic/claude-sonnet-4': 'claude-sonnet-4-20250514',
      'anthropic/claude-opus-4': 'claude-opus-4-20250514',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
      'claude-sonnet-4': 'claude-sonnet-4-20250514',
      'claude-opus-4': 'claude-opus-4-20250514',
    };

    // Check if it's already a valid model ID (has date suffix)
    if (modelString?.startsWith('claude-') && modelString.includes('-202')) {
      return modelString;
    }

    return modelMap[modelString] || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Check if a model string is an Anthropic model
   */
  static isAnthropicModel(modelString) {
    if (!modelString) return false;
    const lower = modelString.toLowerCase();
    return lower.includes('claude') || lower.includes('anthropic');
  }
}

/**
 * Convert transcript to Anthropic message format
 *
 * Anthropic requires alternating user/assistant messages.
 * We bundle the entire conversation history into a single user message
 * to avoid the alternating message constraint.
 */
export function convertToAnthropicMessages(transcript) {
  if (!transcript || transcript.length === 0) {
    return [];
  }

  // Build a formatted conversation history
  const historyLines = [];

  for (const entry of transcript) {
    if (entry.type === 'agent_turn') {
      historyLines.push(`${entry.senderName}: ${entry.publicMessage}`);
    } else if (entry.type === 'god_mode') {
      historyLines.push(`[DIRECTOR INSTRUCTION]: ${entry.content}`);
    }
  }

  if (historyLines.length === 0) {
    return [];
  }

  // Return as a single user message with the full context
  return [
    {
      role: 'user',
      content: `Here is the conversation so far:\n\n${historyLines.join('\n\n')}\n\nNow it's your turn to respond.`,
    },
  ];
}
