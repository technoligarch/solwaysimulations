import dotenv from 'dotenv';
import path from 'path';
// Force load the .env file from the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { OrchestrationEngine } from './orchestration.js';
import { search } from './tool_executor.js';
import OpenAI from 'openai';


const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// DEBUGGING: Check if key is loaded
const key = process.env.OPENROUTER_API_KEY;
console.log("------------------------------------------------");
console.log("DEBUG: Loading API Key...");
if (key) {
    console.log(`DEBUG: Key found! Starts with: ${key.substring(0, 10)}...`);
} else {
    console.log("DEBUG: ❌ NO KEY FOUND in process.env");
    console.log("DEBUG: Current folder is:", process.cwd());
}
console.log("------------------------------------------------");

// State management
let sessions = new Map(); // sessionId -> orchestration engine instance
let wsClients = new Map(); // sessionId -> set of connected ws clients

// Initialize OpenRouter Client
// We add a fallback "dummy" key so the server doesn't crash immediately if the key is missing
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "DUMMY_KEY_TO_PREVENT_CRASH", 
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI Agent Simulation",
  },
});

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/session/create', (req, res) => {
  const { agents, scenario, initialPrompt } = req.body;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // We pass the single openRouterClient to the engine now
  // V2: Create a toolbox object to pass to the engine
  const toolbox = {
    search: search,
  };
  const engine = new OrchestrationEngine(
  agents,
  scenario,
  initialPrompt,
  openRouterClient,
  toolbox // <-- ADDED THIS LINE
);

  sessions.set(sessionId, engine); 
  engine.setSessionId(sessionId); // Vital fix for live messages
  wsClients.set(sessionId, new Set());

  res.json({ sessionId, message: 'Session created' });
});

app.post('/api/session/:sessionId/start', (req, res) => {
  const { sessionId } = req.params;
  const engine = sessions.get(sessionId);

  if (!engine) {
    return res.status(404).json({ error: 'Session not found' });
  }

  engine.start();
  broadcastToSession(sessionId, {
    type: 'status',
    data: { status: 'running' }
  });

  res.json({ message: 'Session started' });
});

app.post('/api/session/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  const engine = sessions.get(sessionId);

  if (!engine) {
    return res.status(404).json({ error: 'Session not found' });
  }

  engine.stop();
  broadcastToSession(sessionId, {
    type: 'status',
    data: { status: 'paused' }
  });

  res.json({ message: 'Session stopped' });
});

app.post('/api/session/:sessionId/godmode', (req, res) => {
  const { sessionId } = req.params;
  const { prompt } = req.body;
  const engine = sessions.get(sessionId);

  if (!engine) {
    return res.status(404).json({ error: 'Session not found' });
  }

  engine.injectGodModePrompt(prompt);

  res.json({ message: 'God mode prompt injected' });
});

app.get('/api/session/:sessionId/transcript', (req, res) => {
  const { sessionId } = req.params;
  const engine = sessions.get(sessionId);

  if (!engine) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ transcript: engine.getTranscript() });
});

// WebSocket handling
wss.on('connection', (ws, req) => {
  const sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sessionId');

  if (!sessionId || !sessions.has(sessionId)) {
    ws.close(1008, 'Invalid session');
    return;
  }

  wsClients.get(sessionId).add(ws);

  ws.on('close', () => {
    wsClients.get(sessionId).delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcastToSession(sessionId, message) {
  const clients = wsClients.get(sessionId);
  if (clients) {
    const payload = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  }
}

// Make broadcastToSession available globally for the orchestration engine
global.broadcastToSession = broadcastToSession;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Orchestration server running on port ${PORT}`);
});
