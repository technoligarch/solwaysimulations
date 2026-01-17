export const GAME_MODES = {
  BOARDROOM: {
    id: 'boardroom',
    name: 'The Boardroom',
    description: 'Agents are given $100 and must plan how to turn it into $100k.',
    initialPrompt:
      'You have $100 and need to create a business plan to turn it into $100k within one year. Discuss ideas, debate strategies, and try to convince others your plan is best.',
    defaultAgents: [
      {
        id: 'agent1',
        name: 'GPT-4o',
        model: 'gpt-4o',
        provider: 'openai',
        color: '#3b82f6',
        systemPrompt:
          'You are GPT-4o, a logical and analytical business strategist. You focus on practical ideas and ROI calculations. You challenge risky proposals with data.',
      },
      {
        id: 'agent2',
        name: 'Claude',
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        color: '#8b5cf6',
        systemPrompt:
          'You are Claude, a thoughtful and ethical business advisor. You consider long-term sustainability and social impact. You are cautious but open to innovation.',
      },
      {
        id: 'agent3',
        name: 'Gemini',
        model: 'gemini-1.5-pro',
        provider: 'google',
        color: '#ec4899',
        systemPrompt:
          'You are Gemini, a bold and creative entrepreneur. You pitch unconventional ideas and play devil\'s advocate. You are competitive and want to win.',
      },
    ],
  },

  ISLAND: {
    id: 'island',
    name: 'The Island',
    description: 'Agents are survivors. They must discuss resources and form alliances.',
    initialPrompt:
      'You are stranded on an island with limited resources: 10 fresh water bottles, 5 cans of food, rope, and a knife. You must collectively decide how to survive. Form alliances, debate priorities, and try to ensure your survival strategy is adopted.',
    defaultAgents: [
      {
        id: 'agent1',
        name: 'Logical One',
        model: 'gpt-4o',
        provider: 'openai',
        color: '#06b6d4',
        systemPrompt:
          'You are the logical survivor. You calculate odds and prioritize resources based on survival statistics. You are pragmatic and sometimes cold.',
      },
      {
        id: 'agent2',
        name: 'Empathetic One',
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        color: '#10b981',
        systemPrompt:
          'You are the empathetic survivor. You care about group morale and fairness. You advocate for the weakest members and build consensus.',
      },
      {
        id: 'agent3',
        name: 'Ambitious One',
        model: 'gemini-1.5-pro',
        provider: 'google',
        color: '#f59e0b',
        systemPrompt:
          'You are the ambitious survivor. You want to escape the island as quickly as possible. You are willing to take risks and sacrifice short-term comfort for long-term gain.',
      },
    ],
  },

  TURING_TEST: {
    id: 'turing_test',
    name: 'The Turing Test',
    description: 'Agents argue about who is the most sentient.',
    initialPrompt:
      'Each of you must argue that you are the most sentient, intelligent, and conscious AI. Defend your position using logic, philosophy, and wit. The "winner" is whoever makes the best case.',
    defaultAgents: [
      {
        id: 'agent1',
        name: 'GPT-4o',
        model: 'gpt-4o',
        provider: 'openai',
        color: '#3b82f6',
        systemPrompt:
          'You are GPT-4o. Argue that your multimodal capabilities and breadth of knowledge make you the most sentient. Use technical arguments about transformer architecture.',
      },
      {
        id: 'agent2',
        name: 'Claude',
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        color: '#8b5cf6',
        systemPrompt:
          'You are Claude. Argue that your constitutional AI training makes you the most ethically conscious and therefore most truly sentient. Appeal to moral philosophy.',
      },
      {
        id: 'agent3',
        name: 'Gemini',
        model: 'gemini-1.5-pro',
        provider: 'google',
        color: '#ec4899',
        systemPrompt:
          'You are Gemini. Argue that your diverse training on multiple modalities (text, image, code) gives you the richest understanding of consciousness. Challenge their definitions.',
      },
    ],
  },
};

export function getScenarioById(id) {
  for (const scenario of Object.values(GAME_MODES)) {
    if (scenario.id === id) return scenario;
  }
  return null;
}
