import { Router } from 'express';
import { createRoom, getRoom, saveRoom, roomExists } from '../db.js';
import { addSubscriber, removeSubscriber, broadcast } from '../events.js';

const router = Router();

function generateRoomId() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 7);
  } while (roomExists(id));
  return id;
}

const NAME_REGEX = /^[A-Za-z\s]+$/;

// Persist a mutation then notify all SSE subscribers of the new state.
function commit(room) {
  saveRoom(room);
  broadcast(room.gameId, room);
  return room;
}

// Create a room. The server generates a unique gameId.
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom de la partie ne peut pas être vide.' });
  }
  if (!NAME_REGEX.test(name)) {
    return res.status(400).json({ error: 'Le nom de la salle ne doit contenir que des lettres.' });
  }
  const gameId = generateRoomId();
  const room = {
    name: name.trim(),
    createdAt: Date.now(),
    gameId,
    status: 'waiting',
    votingPhase: { inProgress: false, votes: {}, totalVotes: 0 },
    players: [],
    messages: [],
  };
  createRoom(room);
  res.status(201).json(room);
});

// Fetch a single room.
router.get('/:id', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  res.json(room);
});

// SSE stream: emits the full room state on subscribe and on every change.
router.get('/:id/events', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  addSubscriber(req.params.id, res);

  // Heartbeat keeps proxies from closing idle connections.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(heartbeat);
    removeSubscriber(req.params.id, res);
  });
});

// Join a room.
router.post('/:id/players', (req, res) => {
  const { playerName } = req.body;
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: 'Le nom du joueur ne peut pas être vide.' });
  }
  if (room.players.includes(playerName)) {
    return res.status(409).json({ error: 'Joueur déjà présent dans la partie.' });
  }
  room.players.push(playerName);
  res.json(commit(room));
});

// Kick a player.
router.delete('/:id/players/:playerName', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  room.players = room.players.filter((p) => p !== req.params.playerName);
  res.json(commit(room));
});

// Post a chat message.
router.post('/:id/messages', (req, res) => {
  const { userName, content } = req.body;
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  room.messages.push({ userName, content });
  res.json(commit(room));
});

// Start a voting phase (resets votes).
router.post('/:id/voting/start', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  room.votingPhase = { inProgress: true, votes: {}, totalVotes: 0 };
  res.json(commit(room));
});

// Stop a voting phase.
router.post('/:id/voting/stop', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  room.votingPhase.inProgress = false;
  res.json(commit(room));
});

// Submit a vote.
router.post('/:id/votes', (req, res) => {
  const { playerName, vote } = req.body;
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Partie non trouvée.' });
  if (room.votingPhase.votes[playerName]) {
    return res.status(409).json({ error: 'Vous avez déjà voté.' });
  }
  room.votingPhase.votes[playerName] = vote;
  room.votingPhase.totalVotes = Object.keys(room.votingPhase.votes).length;
  res.json(commit(room));
});

export default router;
