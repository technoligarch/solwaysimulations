import { create } from 'zustand';

export const useOrchestrationStore = create((set, get) => ({
  // =================================================================
  // STATE: The "memory" of our application
  // =================================================================
  sessionId: null,
  scenario: '',
  initialPrompt: '',
  agents: [],
  transcript: [], // Will now store the full V2 turn objects { publicMessage, privateThought, ... }
  isRunning: false,
  agentStatuses: {}, // V2: Tracks what each agent is doing, e.g., { agent_1: 'thinking' }

  // =================================================================
  // ACTIONS: Functions that change the state
  // =================================================================
  setSessionId: (id) => set({ sessionId: id }),
  setScenario: (name) => set({ scenario: name }),
  setInitialPrompt: (prompt) => set({ initialPrompt: prompt }),
  setAgents: (agents) => set({ agents }),
  setIsRunning: (running) => set({ isRunning: running }),

  // V2: This action now handles the complex turn data from the backend
  addTurnData: (turnData) => {
    // When a full turn arrives, we clear the status for that agent
    const agentId = turnData.senderId;
    const newStatuses = { ...get().agentStatuses };
    delete newStatuses[agentId];

    set((state) => ({
      transcript: [...state.transcript, turnData],
      agentStatuses: newStatuses,
    }));
  },

  // V2: This new action handles simple status messages like "thinking" or "searching"
  setAgentStatus: (agentId, status) => {
    // Don't show "speaking" as it's too fast to be useful
    if (status === 'speaking') return;

    set((state) => ({
      agentStatuses: { ...state.agentStatuses, [agentId]: status },
    }));
  },

  // Resets the entire state when the user starts a new simulation
  reset: () =>
    set({
      sessionId: null,
      scenario: '',
      initialPrompt: '',
      transcript: [],
      isRunning: false,
      agentStatuses: {},
    }),
}));