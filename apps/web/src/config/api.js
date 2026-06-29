// Backend client. Replaces Firebase/Firestore. The base URL points at the
// Express API (a custom VPS in production), configured via VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const createRoom = (name) =>
  request('/rooms', { method: 'POST', body: JSON.stringify({ name }) });

export const getRoom = (roomId) => request(`/rooms/${roomId}`);

export const joinRoom = (roomId, playerName) =>
  request(`/rooms/${roomId}/players`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });

export const kickPlayer = (roomId, playerName) =>
  request(`/rooms/${roomId}/players/${encodeURIComponent(playerName)}`, {
    method: 'DELETE',
  });

export const sendMessage = (roomId, userName, content) =>
  request(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ userName, content }),
  });

export const startVoting = (roomId) =>
  request(`/rooms/${roomId}/voting/start`, { method: 'POST' });

export const stopVoting = (roomId) =>
  request(`/rooms/${roomId}/voting/stop`, { method: 'POST' });

export const submitVote = (roomId, playerName, vote) =>
  request(`/rooms/${roomId}/votes`, {
    method: 'POST',
    body: JSON.stringify({ playerName, vote }),
  });

// Real-time room subscription via Server-Sent Events (replaces onSnapshot).
// Returns an unsubscribe function.
export function subscribeRoom(roomId, onData) {
  const source = new EventSource(`${API_URL}/api/rooms/${roomId}/events`);
  source.onmessage = (event) => {
    try {
      onData(JSON.parse(event.data));
    } catch {
      /* ignore heartbeats / malformed frames */
    }
  };
  return () => source.close();
}
