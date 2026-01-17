import { useState } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';

export default function CastConfiguration({ scenario, onUpdate }) {
  const [agents, setAgents] = useState(scenario.defaultAgents);

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
      <h2 className="text-2xl font-bold mb-4">Configure Your Cast</h2>

      <div className="space-y-4 mb-6">
        {agents.map((agent, idx) => (
          <div key={agent.id} className="border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-400">Name</label>
                <input
                  type="text"
                  value={agent.name}
                  onChange={(e) => handleAgentChange(idx, 'name', e.target.value)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-400">Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={agent.color}
                    onChange={(e) => handleAgentChange(idx, 'color', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={agent.color}
                    onChange={(e) => handleAgentChange(idx, 'color', e.target.value)}
                    className="flex-1 bg-slate-800 text-white px-3 py-2 rounded border border-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-400">Model</label>
                <input
                  type="text"
                  value={agent.model}
                  onChange={(e) => handleAgentChange(idx, 'model', e.target.value)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
                  placeholder="e.g., gpt-4o"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-400">Provider</label>
                <select
                  value={agent.provider}
                  onChange={(e) => handleAgentChange(idx, 'provider', e.target.value)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-400">System Prompt</label>
              <textarea
                value={agent.systemPrompt}
                onChange={(e) => handleAgentChange(idx, 'systemPrompt', e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600 h-24"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-brand text-white font-bold py-2 rounded-lg hover:opacity-90 transition"
      >
        Confirm Cast
      </button>
    </div>
  );
}
