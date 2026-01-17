import { useEffect, useRef } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';
import Turn from '../components/Turn'; // V2: We import our new Turn component

export default function OrchestratorPage() {
  const transcript = useOrchestrationStore((state) => state.transcript);
  const agents = useOrchestrationStore((state) => state.agents);
  const agentStatuses = useOrchestrationStore((state) => state.agentStatuses);
  const scrollRef = useRef(null);

  // Automatically scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, agentStatuses]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700 shadow-lg text-center">
        <h1 className="text-xl font-bold">AI Reality Show: Live</h1>
      </header>

      {/* Main Content: Transcript and Agent Statuses */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Render the transcript using our new Turn component */}
        {transcript.map((turnData, index) => (
          <Turn key={index} turnData={turnData} />
        ))}

        {/* V2: Display "is thinking..." statuses at the bottom */}
        <div className="pt-2">
          {Object.entries(agentStatuses).map(([agentId, status]) => {
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return null;

            return (
              <div key={agentId} className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: agent.color }}
                ></div>
                <span>{agent.name} is {status}...</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer can be added here later for controls like Stop/God Mode */}
    </div>
  );
}