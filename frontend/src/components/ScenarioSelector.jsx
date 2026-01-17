import { GAME_MODES } from '../utils/scenarios';

export default function ScenarioSelector({ onSelect }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Scenario</h2>
      <p className="text-slate-400 mb-6">Pick a game mode to start your show</p>

      <div className="space-y-3">
        {Object.values(GAME_MODES).map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className="w-full p-4 border border-slate-700 rounded-lg hover:border-brand hover:bg-slate-800 transition text-left"
          >
            <h3 className="font-bold text-white mb-1">{scenario.name}</h3>
            <p className="text-slate-400 text-sm">{scenario.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
