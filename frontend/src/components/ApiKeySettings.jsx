import { useState } from 'react';

export default function ApiKeySettings({ onConfirm }) {
  const [keys, setKeys] = useState({
    openai: localStorage.getItem('openai_key') || '',
    anthropic: localStorage.getItem('anthropic_key') || '',
    google: localStorage.getItem('google_key') || '',
  });

  const handleKeyChange = (provider, value) => {
    setKeys({ ...keys, [provider]: value });
  };

  const handleConfirm = () => {
    // Save to local storage
    if (keys.openai) localStorage.setItem('openai_key', keys.openai);
    if (keys.anthropic) localStorage.setItem('anthropic_key', keys.anthropic);
    if (keys.google) localStorage.setItem('google_key', keys.google);

    onConfirm(keys);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add API Keys</h2>
      <p className="text-slate-400 mb-6">Provide your LLM provider API keys. They are stored locally and not sent to servers.</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-semibold text-slate-400">OpenAI API Key (optional)</label>
          <input
            type="password"
            value={keys.openai}
            onChange={(e) => handleKeyChange('openai', e.target.value)}
            placeholder="sk-..."
            className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-400">Anthropic API Key (optional)</label>
          <input
            type="password"
            value={keys.anthropic}
            onChange={(e) => handleKeyChange('anthropic', e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-400">Google API Key (optional)</label>
          <input
            type="password"
            value={keys.google}
            onChange={(e) => handleKeyChange('google', e.target.value)}
            placeholder="AIza..."
            className="w-full bg-slate-800 text-white px-3 py-2 rounded mt-1 border border-slate-600"
          />
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
