const API_BASE = '/api';

export async function createSession(agents, scenario, initialPrompt) {
  const response = await fetch(`${API_BASE}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents, scenario, initialPrompt }),
  });
  return response.json();
}

export async function startSession(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/start`, {
    method: 'POST',
  });
  return response.json();
}

export async function stopSession(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/stop`, {
    method: 'POST',
  });
  return response.json();
}

export async function injectGodMode(sessionId, prompt) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/godmode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}

export async function getTranscript(sessionId) {
  const response = await fetch(`${API_BASE}/session/${sessionId}/transcript`);
  return response.json();
}

export function connectWebSocket(sessionId, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(
    `${protocol}://${window.location.host}/api/session?sessionId=${sessionId}`
  );

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessage(message);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
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
