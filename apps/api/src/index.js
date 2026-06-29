import express from 'express';
import cors from 'cors';
import roomsRouter from './routes/rooms.js';
import { deleteRoomsOlderThan } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS_ORIGIN is a comma-separated allowlist (e.g. the Vercel frontend URL).
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/rooms', roomsRouter);

// Purge rooms older than 48h, hourly. Replaces the old client-side cleanup.
const ROOM_TTL_MS = 1000 * 60 * 60 * 48;
const cleanup = () => {
  const removed = deleteRoomsOlderThan(Date.now() - ROOM_TTL_MS);
  if (removed > 0) console.log(`[cleanup] removed ${removed} stale room(s)`);
};
cleanup();
setInterval(cleanup, 1000 * 60 * 60);

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
