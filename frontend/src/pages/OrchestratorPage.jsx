import { useRef, useEffect, useState } from 'react';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { stopSession, injectGodMode, getTranscript, exportTranscript } from '../utils/api';
import MessageView from '../components/MessageView';
import ControlPanel from '../components/ControlPanel';

export default function OrchestratorPage() {
  const sessionId = useOrchestrationStore((state) => state.sessionId);
  const transcript = useOrchestrationStore((state) => state.transcript);
  const isRunning = useOrchestrationStore((state) => state.isRunning);
  const scenario = useOrchestrationStore((state) => state.scenario);

  const setIsRunning = useOrchestrationStore((state) => state.setIsRunning);
  const resetSession = useOrchestrationStore((state) => state.resetSession);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleGodMode = async (prompt) => {
    if (!sessionId) return;
    try {
      await injectGodMode(sessionId, prompt);
    } catch (error) {
      console.error('Error injecting god mode prompt:', error);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    try {
      await stopSession(sessionId);
      setIsRunning(false);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const handleExport = (format) => {
    const data = exportTranscript(transcript, format);
    const filename = `transcript_${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setShowExportMenu(false);
  };

  const handleReset = () => {
    resetSession();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{scenario}</h1>
            <p className="text-sm text-slate-400">
              {isRunning ? '🔴 Live' : '⏸️ Paused'} - {transcript.length} messages
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition"
              >
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    Export as TXT
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-white transition"
            >
              End Show
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Message view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageView transcript={transcript} />
        </div>

        {/* Control panel */}
        <ControlPanel
          isRunning={isRunning}
          onStop={handleStop}
          onGodMode={handleGodMode}
        />
      </div>
    </div>
  );
}
