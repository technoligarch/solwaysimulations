# Multi-Agent Orchestration Engine

A web-based entertainment platform that simulates Reality TV environments where different AI models act as distinct personalities in autonomous group chats.

## 🎬 Features

- **Multi-Agent Orchestration**: Autonomous conversations between AI personalities (GPT-4o, Claude, Gemini)
- **Pre-set Game Modes**:
  - The Boardroom (Business Challenge)
  - The Island (Survivor-style)
  - The Turing Test (Philosophical Debate)
- **God Mode Controls**: Inject twists and scenarios into the conversation in real-time
- **Live Streaming UI**: Discord/Slack-like message interface with real-time updates
- **Export Capabilities**: Save transcripts as JSON or TXT for content creation
- **Dark Mode Design**: Modern, sleek UI with support for agent customization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- API keys for at least one LLM provider (OpenAI, Anthropic, or Google)

### Installation

1. Clone the repository
```bash
cd /home/user/solwaysimulations
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📖 How to Use

1. **Choose a Scenario**: Select from pre-set game modes or create custom ones
2. **Configure Cast**: Customize agent personalities with unique system prompts
3. **Add API Keys**: Provide your LLM provider credentials
4. **Action!**: Start the autonomous show
5. **God Mode**: Inject twists using the control panel
6. **Cut!**: Stop when satisfied
7. **Export**: Save the transcript for later use

## 🏗️ Architecture

```
/backend
  - Express server for orchestration
  - WebSocket for real-time updates
  - Multi-provider API client integration

/frontend
  - React + TypeScript + Vite
  - Tailwind CSS for styling
  - Zustand for state management
```

## 🔌 API Reference

### Session Management

- `POST /api/session/create` - Create a new orchestration session
- `POST /api/session/:sessionId/start` - Start autonomous loop
- `POST /api/session/:sessionId/stop` - Pause the show
- `POST /api/session/:sessionId/godmode` - Inject a twist
- `GET /api/session/:sessionId/transcript` - Get full transcript

### WebSocket

Connect to `ws://localhost:3001/api/session?sessionId=<sessionId>` to receive real-time updates.

## 🛠️ Configuration

### Supported LLM Providers

- **OpenAI**: GPT-4o, GPT-4 Turbo, etc.
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, etc.
- **Google**: Gemini 1.5 Pro, Gemini 2.0, etc.

### Game Mode Template

```javascript
{
  id: 'custom',
  name: 'Your Scenario',
  description: 'Description here',
  initialPrompt: 'The initial prompt all agents will see',
  defaultAgents: [
    {
      id: 'agent1',
      name: 'Agent Name',
      model: 'model-name',
      provider: 'openai|anthropic|google',
      color: '#hexcolor',
      systemPrompt: 'Define the personality...'
    }
  ]
}
```

## 💾 Export Formats

- **JSON**: Full structured data with timestamps
- **TXT**: Human-readable transcript format

## 🔒 Security

- API keys are stored locally in localStorage and never sent to backend during setup
- Backend expects keys via environment variables only
- Messages are never logged or stored permanently

## 📝 Development

### Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js          - Express server
│   │   ├── orchestration.js   - Orchestration engine
│   │   └── apiClients.js      - LLM provider clients
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             - Page components
│   │   ├── components/        - Reusable components
│   │   ├── store/             - Zustand store
│   │   └── utils/             - Utilities
│   └── package.json
└── package.json (root)
```

## 🚫 Limitations & Future Work

### Current Limitations
- Single session per instance (can be improved with database)
- No persistent session storage
- Limited to turn-based orchestration
- No video/audio support yet

### Planned Features
- Database integration for session persistence
- Custom agent creation UI
- Stream-based response handling for longer messages
- Video export with agent avatars
- Multi-session hosting
- Premium LLM model library

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! Please feel free to extend game modes or add new features.

## 💬 Support

For issues, questions, or feature requests, open an issue on GitHub.
