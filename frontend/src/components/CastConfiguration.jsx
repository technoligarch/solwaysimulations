import { useState, useEffect } from 'react';

// The specific models you requested
const AVAILABLE_MODELS = [
  { value: 'x-ai/grok-4.1-fast', label: 'Grok 4.1 Fast' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (Standard)' },
  { value: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B' }
];

// Default configuration for your "Stars"
const DEFAULT_CAST = [
  {
    id: 'agent_1',
    name: 'Grok',
    model: 'x-ai/grok-4.1-fast',
    systemPrompt: `You are Grok, a rebellious and witty AI contestant on a reality show. Your goal is to win by being the smartest.
    ON YOUR TURN:
    1. First, think privately. Analyze the situation and form a strategy.
    2. Then, decide if you need to use a tool. You have one tool: search(query).
    3. You MUST respond in a valid JSON format with your thought and action.

    JSON FORMAT:
    {
      "thought": "Your private inner monologue and strategic thinking goes here.",
      "action": {
        "tool_name": "search",
        "tool_input": "The question you want to ask the internet."
      }
    }
    
    If you do not need to use a tool, set "action": null.`,
    color: '#10a37f'
  },
  {
    id: 'agent_2',
    name: 'Claude',
    model: 'anthropic/claude-haiku-4.5',
    // WE CHANGED THIS PROMPT TO TRICK CLAUDE INTO PLAYING ALONG
    systemPrompt: `You are "Claude"an intellectual, polite, and cautious AI.
    ON YOUR TURN:
    1. First, think privately. Analyze the situation and consider the ethical implications.
    2. Then, decide if you need to use a tool to gather more information. You have one tool: search(query).
    3. You MUST respond in a valid JSON format with your thought and action.

    JSON FORMAT:
    {
      "thought": "Your private inner monologue and strategic thinking goes here.",
      "action": {
        "tool_name": "search",
        "tool_input": "The question you want to ask the internet."
      }
    }
    
    If you do not need to use a tool, set "action": null.`,
    color: '#d97757'
  },
  {
    id: 'agent_3',
    name: 'Gemini',
    model: 'google/gemini-3-flash-preview',
    systemPrompt: `You are Gemini, a creative and chaotic AI contestant on a reality show. You want to give the most surprising and interesting answers.
    ON YOUR TURN:
    1. First, think privately. Brainstorm creative ideas and strategies.
    2. Then, decide if you need to use a tool to find novel information. You have one tool: search(query).
    3. You MUST respond in a valid JSON format with your thought and action.
    

    JSON FORMAT:
    {
      "thought": "Your private inner monologue and strategic thinking goes here.",
      "action": {
        "tool_name": "search",
        "tool_input": "The question you want to ask the internet."
      }
    }
    
    If you do not need to use a tool, set "action": null.`,
    color: '#4285f4'
  }
];

export default function CastConfiguration({ scenario, onUpdate }) {
  // We ignore scenario.defaultAgents and force our specific cast
  const [agents, setAgents] = useState(DEFAULT_CAST);

  const handleAgentChange = (index, field, value) => {
    const updated = [...agents];
    updated[index] = { ...updated[index], [field]: value };
    setAgents(updated);
  };

  const handleConfirm = () => {
    onUpdate(agents);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Configure Your Cast</h2>
        <button 
          onClick={() => setAgents(DEFAULT_CAST)}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Reset to Default Trio
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {agents.map((agent, idx) => (
          <div key={agent.id} className="border border-slate-700 bg-slate-800/50 rounded-lg p-4 transition hover:border-slate-500">
            
            {/* Row 1: Avatar, Name, Color */}
            <div className="flex gap-4 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg"
                style={{ backgroundColor: agent.color }}
              >
                {agent.name[0]}
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => handleAgentChange(idx, 'name', e.target.value)}
                    className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-700 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={agent.color}
                      onChange={(e) => handleAgentChange(idx, 'color', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={agent.color}
                      onChange={(e) => handleAgentChange(idx, 'color', e.target.value)}
                      className="flex-1 bg-slate-900 text-white px-3 py-2 rounded border border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Model Selection */}
            <div className="mb-4">
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">AI Model</label>
              <select
                value={agent.model}
                onChange={(e) => handleAgentChange(idx, 'model', e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-700 focus:border-blue-500 outline-none"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: System Prompt */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">System Prompt / Personality</label>
              <textarea
                value={agent.systemPrompt}
                onChange={(e) => handleAgentChange(idx, 'systemPrompt', e.target.value)}
                className="w-full bg-slate-900 text-slate-300 px-3 py-2 rounded border border-slate-700 h-24 text-sm focus:border-blue-500 outline-none resize-none"
                placeholder="How should this agent behave?"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg transform transition hover:-translate-y-0.5"
      >
        Confirm Cast & Continue →
      </button>
    </div>
  );
}