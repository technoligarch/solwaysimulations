import { useState } from 'react';

export default function ApiKeySettings({ onConfirm }) {
  const [keys, setKeys] = useState({
    openrouter: localStorage.getItem('openrouter_key') || '',
    tavily: localStorage.getItem('tavily_key') || '',
  });

  const handleKeyChange = (provider, value) => {
    setKeys({ ...keys, [provider]: value });
  };

  const handleConfirm = () => {
    // Save to local storage
    if (keys.openrouter) localStorage.setItem('openrouter_key', keys.openrouter);
    if (keys.tavily) localStorage.setItem('tavily_key', keys.tavily);

    onConfirm(keys);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add API Keys</h2>
      <p className="text-slate-400 mb-6">Provide your OpenRouter API key (required) and optionally a Tavily API key for web search. Keys are stored locally and not sent to servers.</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-semibold text-slate-400">OpenRouter API Key (required)</label>
          <input
            type="password"
            value={keys.openrouter}
            onChange={(e) => handleKeyChange('openrouter', e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
          />
          <p className="text-xs text-slate-500 mt-1">Get your key from https://openrouter.ai</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-400">Tavily API Key (optional)</label>
          <input
            type="password"
            value={keys.tavily}
            onChange={(e) => handleKeyChange('tavily', e.target.value)}
            placeholder="tvly-..."
            className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
          />
          <p className="text-xs text-slate-500 mt-1">Optional - enables web search. Get your key from https://tavily.com</p>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-brand text-white font-bold py-2 rounded-lg hover:opacity-90 transition"
      >
        Continue
      </button>
    </div>
  );
}
