import { create } from 'zustand';

export const useOrchestrationStore = create((set) => ({
  sessionId: null,
  agents: [],
  transcript: [],
  agentStatuses: {},
  isRunning: false,
  scenario: '',
  initialPrompt: '',
  apiKeys: {
    openrouter: '',
    tavily: '',
  },

  // Session actions
  setSessionId: (sessionId) => set({ sessionId }),
  setAgents: (agents) => set({ agents }),
  setTranscript: (transcript) => set({ transcript }),
  setAgentStatuses: (agentStatuses) => set({ agentStatuses }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setScenario: (scenario) => set({ scenario }),
  setInitialPrompt: (initialPrompt) => set({ initialPrompt }),

  // Transcript actions
  addMessage: (message) =>
    set((state) => ({
      transcript: [...state.transcript, message],
    })),

  // API keys
  setApiKeys: (apiKeys) => set({ apiKeys }),
  updateApiKey: (provider, key) =>
    set((state) => ({
      apiKeys: { ...state.apiKeys, [provider]: key },
    })),

  // Reset
  resetSession: () =>
    set({
      sessionId: null,
      transcript: [],
      agentStatuses: {},
      isRunning: false,
    }),
}));
