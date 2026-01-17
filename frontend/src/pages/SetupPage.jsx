import { useState } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { GAME_MODES } from '../utils/scenarios';
import { createSession, startSession, connectWebSocket } from '../utils/api';
import ScenarioSelector from '../components/ScenarioSelector';
import CastConfiguration from '../components/CastConfiguration';
// Removed ApiKeySettings import since we use server .env now

export default function SetupPage({ onSetupComplete }) {
  const [step, setStep] = useState('scenario'); // scenario, cast, review (removed api)
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const setSessionId = useOrchestrationStore((state) => state.setSessionId);
  const setAgents = useOrchestrationStore((state) => state.setAgents);
  const setScenario = useOrchestrationStore((state) => state.setScenario);
  const setInitialPrompt = useOrchestrationStore((state) => state.setInitialPrompt);
  const setIsRunning = useOrchestrationStore((state) => state.setIsRunning);
  const addMessage = useOrchestrationStore((state) => state.addMessage);

  const handleScenarioSelect = (scenarioId) => {
    const scenario = Object.values(GAME_MODES).find((s) => s.id === scenarioId);
    setSelectedScenario(scenario);
    setStep('cast');
  };

  const handleCastUpdate = (agents) => {
    setAgents(agents);
    setStep('review'); // Skip API key step, go straight to review
  };

  const handleStartShow = async () => {
    if (!selectedScenario) return;

    setIsCreatingSession(true);
    try {
      // Create session
      const response = await createSession(
        useOrchestrationStore.getState().agents,
        selectedScenario.name,
        selectedScenario.initialPrompt
      );

      const newSessionId = response.sessionId;
      setSessionId(newSessionId);
      setScenario(selectedScenario.name);
      setInitialPrompt(selectedScenario.initialPrompt);

      // Get the actions directly from the store
const { addTurnData, setAgentStatus } = useOrchestrationStore.getState();

// Pass them to the WebSocket connection
connectWebSocket(newSessionId, { addTurnData, setAgentStatus });

      // Start the session
      await startSession(newSessionId);
      setIsRunning(true);

      onSetupComplete();
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            AI Reality Engine
          </h1>
          <p className="text-slate-400 text-lg">Simulating: {selectedScenario ? selectedScenario.name : 'Choose Scenario'}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-between mb-8 px-12">
          {['Scenario', 'Cast', 'Review'].map((label, idx) => (
            <div key={label} className="flex-1 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  ['scenario', 'cast', 'review'][idx] === step
                    ? 'bg-blue-600 text-white'
                    : ['scenario', 'cast', 'review'].indexOf(step) > idx
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {['scenario', 'cast', 'review'].indexOf(step) > idx ? '✓' : idx + 1}
              </div>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 shadow-xl">
          {step === 'scenario' && (
            <ScenarioSelector onSelect={handleScenarioSelect} />
          )}

          {step === 'cast' && selectedScenario && (
            <CastConfiguration
              scenario={selectedScenario}
              onUpdate={handleCastUpdate}
            />
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

function ReviewStep({ scenario, onStartShow, isLoading }) {
  const agents = useOrchestrationStore((state) => state.agents);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white">Ready for Action?</h2>

      <div className="space-y-4 mb-6 bg-slate-800 p-4 rounded border border-slate-700">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Scenario</h3>
          <p className="text-white text-lg">{scenario.name}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">The Cast</h3>
          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full" style={{background: agent.color}}></span>
                 <span className="text-slate-300 font-medium">{agent.name}</span>
                 <span className="text-slate-500 text-sm">({agent.model})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStartShow}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition shadow-lg text-lg"
      >
        {isLoading ? 'Initializing Neural Networks...' : '🔴 Start Broadcast'}
      </button>
    </div>
  );
}