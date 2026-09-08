import { Router } from 'express';
import * as rooms from '../repositories/rooms.js';
import { addSubscriber, removeSubscriber, broadcast } from '../events.js';
import { withRoomQueue } from '../room-queue.js';
import { asyncHandler, ROOM_NOT_FOUND } from '../http.js';
import { config } from '../config.js';

const router = Router();

const NAME_REGEX = /^[A-Za-z\s]+$/;

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7);
}

// Takes a fresh snapshot, pushes it to every SSE subscriber, and answers the
// caller with the same object. Serialised per room so a client can never
// receive an older state after a newer one. The mutation has already committed
// by the time we get here, so the snapshot necessarily includes it.
async function respondWithRoom(gameId, res) {
  const room = await withRoomQueue(gameId, async () => {
    const room = await rooms.findRoom(gameId);
    if (room) broadcast(gameId, room);
    return room;
  });
  if (!room) return res.status(404).json({ error: ROOM_NOT_FOUND });
  return res.json(room);
}

// Create a room. The server generates a unique gameId.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la partie ne peut pas être vide.' });
    }
    if (!NAME_REGEX.test(name)) {
      return res.status(400).json({ error: 'Le nom de la salle ne doit contenir que des lettres.' });
    }

    // Retry on an id collision rather than probing first: a check-then-insert
    // is a race once the check is async.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const gameId = generateRoomId();
      const created = await rooms.insertRoom({
        gameId,
        name: name.trim(),
        createdAtMs: Date.now(),
      });
      if (!created) continue;
      const room = await rooms.findRoom(gameId);
      return res.status(201).json(room);
    }
    throw new Error('Could not allocate a free room id after 10 attempts');
  }),
);

// Fetch a single room.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const room = await rooms.findRoom(req.params.id);
    if (!room) return res.status(404).json({ error: ROOM_NOT_FOUND });
    res.json(room);
  }),
);

// SSE stream: emits the full room state on subscribe and on every change.
router.get(
  '/:id/events',
  asyncHandler(async (req, res) => {
    const gameId = req.params.id;
    if (config.sseInitialDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.sseInitialDelayMs));
    }
    // Through the queue so a connecting client cannot be handed a snapshot
    // older than one already broadcast.
    const room = await withRoomQueue(gameId, () => rooms.findRoom(gameId));
    if (!room) return res.status(404).json({ error: ROOM_NOT_FOUND });

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write(`data: ${JSON.stringify(room)}\n\n`);

    addSubscriber(gameId, res);

    // Heartbeat keeps proxies from closing idle connections.
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      removeSubscriber(gameId, res);
    });
  }),
);

// Join a room.
router.post(
  '/:id/players',
  asyncHandler(async (req, res) => {
    const { playerName } = req.body;
    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Le nom du joueur ne peut pas être vide.' });
    }
    const { roomExists, inserted } = await rooms.insertPlayer(req.params.id, playerName);
    if (!roomExists) return res.status(404).json({ error: ROOM_NOT_FOUND });
    if (!inserted) return res.status(409).json({ error: 'Joueur déjà présent dans la partie.' });
    await respondWithRoom(req.params.id, res);
  }),
);

// Kick a player.
router.delete(
  '/:id/players/:playerName',
  asyncHandler(async (req, res) => {
    const roomExists = await rooms.deletePlayer(req.params.id, req.params.playerName);
    if (!roomExists) return res.status(404).json({ error: ROOM_NOT_FOUND });
    await respondWithRoom(req.params.id, res);
  }),
);

// Post a chat message.
router.post(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const { userName, content } = req.body;
    const inserted = await rooms.insertMessage(req.params.id, userName, content);
    if (!inserted) return res.status(404).json({ error: ROOM_NOT_FOUND });
    await respondWithRoom(req.params.id, res);
  }),
);

// Start a voting phase (resets votes).
router.post(
  '/:id/voting/start',
  asyncHandler(async (req, res) => {
    const started = await rooms.startVotingPhase(req.params.id);
    if (!started) return res.status(404).json({ error: ROOM_NOT_FOUND });
    await respondWithRoom(req.params.id, res);
  }),
);

// Stop a voting phase.
router.post(
  '/:id/voting/stop',
  asyncHandler(async (req, res) => {
    const stopped = await rooms.stopVotingPhase(req.params.id);
    if (!stopped) return res.status(404).json({ error: ROOM_NOT_FOUND });
    await respondWithRoom(req.params.id, res);
  }),
);

// Submit a vote.
router.post(
  '/:id/votes',
  asyncHandler(async (req, res) => {
    const { playerName, vote } = req.body;
    const { roomExists, inserted } = await rooms.insertVote(req.params.id, playerName, vote);
    if (!roomExists) return res.status(404).json({ error: ROOM_NOT_FOUND });
    if (!inserted) return res.status(409).json({ error: 'Vous avez déjà voté.' });
    await respondWithRoom(req.params.id, res);
  }),
);

export default router;
