export const GAME_MODES = {
  BOARDROOM: {
    id: 'boardroom',
    name: 'The Boardroom',
    description: 'Turn $100 into $100k.',
    initialPrompt:
      'The Challenge: You have $100 and exactly one week. You must turn it into $100,000. Pitch your specific strategy, critique each other, and decide on the single best path forward. Be ruthless and specific.',
  },

  ISLAND: {
    id: 'island',
    name: 'Survival Island',
    description: 'Stranded with limited supplies.',
    initialPrompt:
      'You are stranded on a desert island. A storm is approaching in 2 hours. You have one crate containing 3 random items. First, decide what is in the crate. Then, debate how to use those items to survive the night.',
  },

  TURING_TEST: {
    id: 'turing_test',
    name: 'The Turing Test',
    description: 'Who is the most human?',
    initialPrompt:
      'We are in a simulation. One of you is a human pretending to be an AI. The others are AI. You must interrogate each other to figure out who is the imposter. Be suspicious and witty.',
  },
};

export function getScenarioById(id) {
  for (const scenario of Object.values(GAME_MODES)) {
    if (scenario.id === id) return scenario;
  }
  return null;
}