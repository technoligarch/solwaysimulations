import { useState } from 'react';

// The "Thought Bubble" icon
const ThoughtBubbleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// The main component for displaying one turn in the transcript
export default function Turn({ turnData }) {
  const [showThought, setShowThought] = useState(false);

  // Different message types will have different styles
  if (turnData.type === 'system_message' || turnData.type === 'god_mode' || turnData.type === 'error') {
    return (
      <div className="text-center my-4">
        <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
          {turnData.senderName}: {turnData.content}
        </span>
      </div>
    );
  }

  // This is the main display for a full agent turn
  const { senderName, senderColor, publicMessage, privateThought, toolUsed, toolResult } = turnData;

  return (
    <div className="flex items-start gap-3 my-4">
      {/* Agent Avatar */}
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: senderColor }}
      >
        {senderName[0]}
      </div>

      {/* Message and Thought Bubble */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold" style={{ color: senderColor }}>{senderName}</span>
          {/* Show the thought bubble icon ONLY if there's a private thought */}
          {privateThought && (
            <button
              onClick={() => setShowThought(!showThought)}
              className="text-gray-500 hover:text-white transition"
              title="Toggle private thought"
            >
              <ThoughtBubbleIcon />
            </button>
          )}
        </div>

        {/* The agent's public message */}
        <p className="text-white whitespace-pre-wrap">{publicMessage}</p>

        {/* The hidden "Confessional Booth" panel */}
        {showThought && (
          <div className="mt-2 p-3 bg-black bg-opacity-30 border border-gray-700 rounded-lg text-xs text-gray-400 animate-fade-in">
            <p className="font-bold mb-1">🤫 Private Thought:</p>
            <p className="italic mb-2">"{privateThought}"</p>
            {toolUsed && (
              <>
                <p className="font-bold mb-1">🛠️ Tool Used: {toolUsed}</p>
                <p className="font-mono bg-gray-900 p-2 rounded whitespace-pre-wrap">
                  {toolResult}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}