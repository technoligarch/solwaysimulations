import { useState } from 'react';

export default function Turn({ turnData }) {
  const [showThought, setShowThought] = useState(false);

  if (turnData.type === 'system_message') {
    return (
      <div className="flex justify-center">
        <div className="bg-slate-700 text-slate-400 text-sm italic text-center px-4 py-2 rounded max-w-2xl whitespace-pre-wrap">
          {turnData.content}
        </div>
      </div>
    );
  }

  if (turnData.type === 'god_mode') {
    return (
      <div className="flex justify-center">
        <div className="border-2 border-yellow-500 bg-slate-800 text-yellow-300 px-6 py-3 rounded max-w-xl text-center">
          <p className="font-bold text-sm mb-2">⚡ God Mode</p>
          <p>{turnData.content}</p>
        </div>
      </div>
    );
  }

  if (turnData.type === 'error') {
    return (
      <div className="flex justify-center">
        <div className="bg-red-900/20 border border-red-700 text-red-400 text-sm px-4 py-2 rounded">
          {turnData.content}
        </div>
      </div>
    );
  }

  if (turnData.type === 'agent_turn') {
    return (
      <div className="flex gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: turnData.senderColor }}
        >
          {turnData.senderName.charAt(0)}
        </div>

        {/* Message bubble and thought section */}
        <div className="flex-1">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}>
            <p className="font-semibold text-white mb-2">{turnData.senderName}</p>
            <p className="text-slate-100 whitespace-pre-wrap">{turnData.publicMessage}</p>
          </div>

          {/* Collapsible thought and tool section */}
          {(turnData.privateThought || turnData.toolUsed) && (
            <button
              onClick={() => setShowThought(!showThought)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
            >
              <span>{showThought ? '▼' : '▶'}</span>
              <span>🤫 Private Thought</span>
            </button>
          )}

          {showThought && (turnData.privateThought || turnData.toolUsed) && (
            <div className="mt-2 text-xs bg-slate-800 rounded p-3 border border-slate-700">
              {turnData.privateThought && (
                <div className="mb-2">
                  <p className="text-slate-500 font-semibold mb-1">Thought:</p>
                  <p className="text-slate-400">{turnData.privateThought}</p>
                </div>
              )}

              {turnData.toolUsed && (
                <div>
                  <p className="text-slate-500 font-semibold mb-1">🛠️ Tool Used: {turnData.toolUsed}</p>
                  {turnData.toolResult && (
                    <div className="text-slate-400">
                      {turnData.toolResult.error ? (
                        <p className="text-red-400">{turnData.toolResult.error}</p>
                      ) : (
                        <>
                          {turnData.toolResult.answer && (
                            <p className="mb-2">{turnData.toolResult.answer}</p>
                          )}
                          {turnData.toolResult.results && turnData.toolResult.results.length > 0 && (
                            <ul className="text-xs space-y-1">
                              {turnData.toolResult.results.map((result, idx) => (
                                <li key={idx} className="text-slate-500">
                                  • {result.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for unknown types
  return null;
}
