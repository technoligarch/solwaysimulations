import { useState } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { GAME_MODES } from '../utils/scenarios';
import { createSession, startSession, connectWebSocket } from '../utils/api';
import ScenarioSelector from '../components/ScenarioSelector';

// 1. HARDCODED CAST MEMBERS
// These are the exact models you requested.
const FIXED_CAST = [
  {
    id: 'agent_grok',
    name: 'Grok',
    model: 'x-ai/grok-4.1-fast',
    systemPrompt: 'You are Grok. You are a rebellious, witty AI with a bit of an edge. You like to challenge assumptions and speak your mind freely.',
    color: '#ef4444', // Red
    icon: '🚀'
  },
  {
    id: 'agent_claude',
    name: 'Claude',
    model: 'anthropic/claude-haiku-4.5',
    systemPrompt: 'You are Claude. You are a helpful, articulate, and highly intelligent AI. You prefer nuanced, thoughtful discussion.',
    color: '#d97706', // Amber
    icon: '🧠'
  },
  {
    id: 'agent_gemini',
    name: 'Gemini',
    model: 'google/gemini-3-flash-preview',
    systemPrompt: 'You are Gemini. You are a fast-thinking, adaptable, and enthusiastic AI. You enjoy connecting disparate ideas.',
    color: '#3b82f6', // Blue
    icon: '✨'
  }
];

export default function SetupPage({ onSetupComplete }) {
  // We only need two steps now: picking the scenario, and reviewing/starting
  const [step, setStep] = useState('scenario'); // 'scenario' | 'review'
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const setSessionId = useOrchestrationStore((state) => state.setSessionId);
  const setAgents = useOrchestrationStore((state) => state.setAgents);
  const setScenario = useOrchestrationStore((state) => state.setScenario);
  const setInitialPrompt = useOrchestrationStore((state) => state.setInitialPrompt);
  const setIsRunning = useOrchestrationStore((state) => state.setIsRunning);
  const addMessage = useOrchestrationStore((state) => state.addMessage);
  const setAgentStatuses = useOrchestrationStore((state) => state.setAgentStatuses);

  // When a scenario is selected, we automatically set the fixed cast
  // and jump straight to the review step.
  const handleScenarioSelect = (scenarioId) => {
    const scenario = Object.values(GAME_MODES).find((s) => s.id === scenarioId);
    setSelectedScenario(scenario);
    
    // Automatically set the 3 hardcoded agents
    setAgents(FIXED_CAST);
    
    // Skip to review
    setStep('review');
  };

  const handleStartShow = async () => {
    if (!selectedScenario) return;

    setIsCreatingSession(true);
    try {
      // Create session with the fixed cast
      const response = await createSession(
        FIXED_CAST,
        selectedScenario.name,
        selectedScenario.initialPrompt
      );

      const newSessionId = response.sessionId;
      setSessionId(newSessionId);
      setScenario(selectedScenario.name);
      setInitialPrompt(selectedScenario.initialPrompt);

      // Connect WebSocket
      connectWebSocket(newSessionId, (message) => {
        if (message.type === 'message') {
          addMessage(message.data);
        } else if (message.type === 'status') {
          setIsRunning(message.data.status === 'running');
        } else if (message.type === 'status_update') {
          setAgentStatuses(message.data);
        }
      });

      // Start the session
      await startSession(newSessionId);
      setIsRunning(true);

      onSetupComplete();
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Check console for details.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand to-purple-600 bg-clip-text text-transparent">
            Multi-Agent Orchestration
          </h1>
          <p className="text-slate-400 text-lg">Featuring Grok, Claude, and Gemini</p>
        </div>

        {/* Simplified Progress Steps */}
        <div className="flex justify-center gap-8 mb-8">
          <StepIndicator label="Select Scenario" isActive={step === 'scenario'} isDone={step === 'review'} number={1} />
          <StepIndicator label="Ready to Action" isActive={step === 'review'} isDone={false} number={2} />
        </div>

        {/* Step content */}
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
          {step === 'scenario' && (
            <ScenarioSelector onSelect={handleScenarioSelect} />
          )}

          {step === 'review' && selectedScenario && (
            <ReviewStep
              scenario={selectedScenario}
              onStartShow={handleStartShow}
              isLoading={isCreatingSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for the circles at the top
function StepIndicator({ label, isActive, isDone, number }) {
  let bgColor = 'bg-slate-700 text-slate-400';
  if (isActive) bgColor = 'bg-brand text-white';
  if (isDone) bgColor = 'bg-green-600 text-white';

  return (
    <div className="text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${bgColor}`}>
        {isDone ? '✓' : number}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// The Final "Action!" Screen
function ReviewStep({ scenario, onStartShow, isLoading }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>

      <div className="space-y-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Scenario</h3>
          <p className="text-white text-lg">{scenario.name}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">The Cast</h3>
          <div className="flex flex-col gap-3">
            {FIXED_CAST.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <div>
                  <span className="font-bold text-white block">{agent.name}</span>
                  <span className="text-xs text-slate-500 font-mono">{agent.model}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStartShow}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-brand to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition text-xl shadow-lg shadow-purple-900/20"
      >
        {isLoading ? 'Connecting to OpenRouter...' : 'Action!'}
      </button>
    </div>
  );
}