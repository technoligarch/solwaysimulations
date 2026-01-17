const API_BASE = '/api';

export async function createSession(agents, scenario, initialPrompt) {
  const response = await fetch(`${API_BASE}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents, scenario, initialPrompt }),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

export async function startSession(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/start`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to start session');
  return response.json();
}

export async function stopSession(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/stop`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to stop session');
  return response.json();
}

export async function injectGodMode(sessionId, prompt) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/godmode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error('Failed to inject prompt');
  return response.json();
}

export async function getTranscript(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/transcript`);
  if (!response.ok) throw new Error('Failed to get transcript');
  return response.json();
}

export function connectWebSocket(sessionId, onMessage) {
  // 1. Determine if we need Secure (wss) or Standard (ws)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // 2. Use the host from the browser window (handles Codespaces URL automatically)
  const host = window.location.host;

  // 3. IMPORTANT: Use '/ws' as the path. 
  // This matches the rule we added to vite.config.js
  const wsUrl = `${protocol}//${host}/ws?sessionId=${sessionId}`;

  console.log("Connecting to WebSocket:", wsUrl); // Debug log

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ WebSocket connected successfully!');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      // V2: Check the message type and call the correct store action
      if (message.type === 'status_update') {
        // This is a new message type for "is thinking..."
        // We get the setAgentStatus function from our onMessage object
        onMessage.setAgentStatus(message.data.agentId, message.data.status);
      } else {
        // This is a regular turn/message
        onMessage.addTurnData(message.data);
      }

    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };

  ws.onclose = (event) => {
    console.log('⚠️ WebSocket disconnected. Code:', event.code);
  };

  return ws;
}

export function exportTranscript(transcript, format = 'json') {
  if (format === 'json') {
    return JSON.stringify(transcript, null, 2);
  } else if (format === 'txt') {
    return transcript
      .map((msg) => `[${msg.senderName || msg.sender}]: ${msg.content}`)
      .join('\n\n');
  }
}