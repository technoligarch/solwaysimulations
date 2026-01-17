export default function MessageBubble({ message }) {
  const { sender, senderName, senderColor, content } = message;

  if (sender === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-slate-700 text-slate-400 text-sm italic text-center px-4 py-2 rounded max-w-xl">
          {content}
        </div>
      </div>
    );
  }

  if (sender === 'god') {
    return (
      <div className="flex justify-center">
        <div className="border-2 border-yellow-500 bg-slate-800 text-yellow-300 px-4 py-2 rounded max-w-xl text-center">
          <p className="font-bold text-sm mb-1">God Mode</p>
          <p>{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className="rounded-lg px-4 py-2 max-w-sm break-words"
        style={{
          backgroundColor: senderColor || '#334155',
          color: 'white',
        }}
      >
        <p className="font-semibold text-sm mb-1">{senderName || sender}</p>
        <p>{content}</p>
      </div>
    </div>
  );
}
