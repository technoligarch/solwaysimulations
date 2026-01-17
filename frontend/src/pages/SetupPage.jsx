import { useState } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { GAME_MODES } from '../utils/scenarios';
import { createSession, startSession, connectWebSocket } from '../utils/api';
import ScenarioSelector from '../components/ScenarioSelector';
import CastConfiguration from '../components/CastConfiguration';
import ApiKeySettings from '../components/ApiKeySettings';

export default function SetupPage({ onSetupComplete }) {
  const [step, setStep] = useState('scenario'); // scenario, cast, api, review
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const setSessionId = useOrchestrationStore((state) => state.setSessionId);
  const setAgents = useOrchestrationStore((state) => state.setAgents);
  const setScenario = useOrchestrationStore((state) => state.setScenario);
  const setInitialPrompt = useOrchestrationStore((state) => state.setInitialPrompt);
  const setIsRunning = useOrchestrationStore((state) => state.setIsRunning);
  const addMessage = useOrchestrationStore((state) => state.addMessage);
  const setApiKeys = useOrchestrationStore((state) => state.setApiKeys);

  const handleScenarioSelect = (scenarioId) => {
    const scenario = Object.values(GAME_MODES).find((s) => s.id === scenarioId);
    setSelectedScenario(scenario);
    setStep('cast');
  };

  const handleCastUpdate = (agents) => {
    setAgents(agents);
    setStep('api');
  };

  const handleApiKeysSet = (keys) => {
    setApiKeys(keys);
    setStep('review');
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

      // Connect WebSocket
      connectWebSocket(newSessionId, (message) => {
        if (message.type === 'message') {
          addMessage(message.data);
        } else if (message.type === 'status') {
          setIsRunning(message.data.status === 'running');
        }
      });

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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand to-purple-600 bg-clip-text text-transparent">
            Multi-Agent Orchestration Engine
          </h1>
          <p className="text-slate-400 text-lg">Create your Reality TV show with AI personalities</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-between mb-8">
          {['Scenario', 'Cast', 'API Keys', 'Review'].map((label, idx) => (
            <div key={label} className="flex-1 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  ['scenario', 'cast', 'api', 'review'][idx] === step
                    ? 'bg-brand text-white'
                    : ['scenario', 'cast', 'api', 'review'].indexOf(step) > idx
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {['scenario', 'cast', 'api', 'review'].indexOf(step) > idx ? '✓' : idx + 1}
              </div>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
          {step === 'scenario' && (
            <ScenarioSelector onSelect={handleScenarioSelect} />
          )}

          {step === 'cast' && selectedScenario && (
            <CastConfiguration
              scenario={selectedScenario}
              onUpdate={handleCastUpdate}
            />
          )}

          {step === 'api' && (
            <ApiKeySettings onConfirm={handleApiKeysSet} />
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
      <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>

      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Scenario</h3>
          <p className="text-white">{scenario.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Cast</h3>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <span
                key={agent.id}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: agent.color, color: 'white' }}
              >
                {agent.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStartShow}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-brand to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        {isLoading ? 'Starting Show...' : 'Action!'}
      </button>
    </div>
  );
}
