import { useState, useEffect } from 'react';
import { useOrchestrationStore } from './store/orchestrationStore';
import SetupPage from './pages/SetupPage';
import OrchestratorPage from './pages/OrchestratorPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('setup');
  const sessionId = useOrchestrationStore((state) => state.sessionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {!sessionId ? (
        <SetupPage onSetupComplete={() => setCurrentPage('orchestrator')} />
      ) : (
        <OrchestratorPage />
      )}
    </div>
  );
}
