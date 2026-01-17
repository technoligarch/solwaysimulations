import { useState } from 'react';

export default function ControlPanel({ isRunning, onStop, onGodMode }) {
  const [godModePrompt, setGodModePrompt] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendGodMode = async () => {
    if (!godModePrompt.trim()) return;

    setIsSending(true);
    try {
      await onGodMode(godModePrompt);
      setGodModePrompt('');
    } catch (error) {
      console.error('Error sending god mode prompt:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 rounded-lg p-6 border border-slate-800 flex flex-col">
      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-sm font-semibold text-slate-400">
            {isRunning ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* God Mode Section */}
      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase">God Mode</h3>
        <p className="text-xs text-slate-400 mb-3">
          Inject a twist or event that all agents will see immediately.
        </p>

        <textarea
          value={godModePrompt}
          onChange={(e) => setGodModePrompt(e.target.value)}
          placeholder="E.g., 'A storm is approaching. Food supplies are running low.'"
          className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 mb-3 h-24 text-sm"
        />

        <button
          onClick={handleSendGodMode}
          disabled={!godModePrompt.trim() || isSending}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition"
        >
          {isSending ? 'Sending...' : 'Inject Twist'}
        </button>
      </div>

      {/* Control buttons */}
      <div className="border-t border-slate-700 mt-4 pt-4">
        <button
          onClick={onStop}
          className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-2 rounded-lg transition"
        >
          Cut!
        </button>
      </div>

      {/* Tips */}
      <div className="border-t border-slate-700 mt-4 pt-4 text-xs text-slate-500">
        <p className="font-semibold mb-2">💡 Tips</p>
        <ul className="space-y-1">
          <li>• Use vivid scenarios</li>
          <li>• Create conflict</li>
          <li>• Add time pressure</li>
          <li>• Test loyalties</li>
        </ul>
      </div>
    </div>
  );
}
