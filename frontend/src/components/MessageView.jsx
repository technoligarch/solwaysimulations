import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageView({ transcript }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  return (
    <div className="bg-slate-950 rounded-lg p-6 overflow-y-auto flex-1 flex flex-col">
      <div className="space-y-4 flex-1">
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Waiting for messages...</p>
          </div>
        ) : (
          transcript.map((message, idx) => (
            <MessageBubble key={idx} message={message} />
          ))
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
}
