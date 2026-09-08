import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import roomsRouter from './routes/rooms.js';
import { deleteRoomsOlderThan } from './repositories/rooms.js';
import { closeAllSubscribers } from './events.js';
import { errorMiddleware } from './http.js';
import { migrate } from './migrate.js';
import { healthCheck, withRetry, close as closeDb } from './db.js';

// Migrations run at boot: Dokploy has no pre-deploy hook, and the advisory lock
// in migrate() makes a concurrent boot safe. A failure exits non-zero, the
// healthcheck fails, and Dokploy rolls the deploy back.
await withRetry(() => migrate(), { label: 'migrate' });
// Pre-warm the pool so the first join does not also pay TCP + auth setup.
await withRetry(() => healthCheck(), { label: 'connect' });

const app = express();

app.use(cors({ origin: config.allowedOrigins.includes('*') ? true : config.allowedOrigins }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await healthCheck();
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[health]', err);
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/rooms', roomsRouter);
app.use(errorMiddleware); // must be last

// Purge stale rooms hourly. ON DELETE CASCADE sweeps their players, messages
// and votes.
const cleanup = async () => {
  try {
    const removed = await deleteRoomsOlderThan(Date.now() - config.roomTtlMs);
    if (removed > 0) console.log(`[cleanup] removed ${removed} stale room(s)`);
  } catch (err) {
    console.error('[cleanup]', err);
  }
};
await cleanup();
const cleanupTimer = setInterval(cleanup, 1000 * 60 * 60);

const server = app.listen(config.port, () => console.log(`API listening on :${config.port}`));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal}`);
  clearInterval(cleanupTimer);
  closeAllSubscribers();
  server.close();
  server.closeIdleConnections?.();
  const force = setTimeout(() => process.exit(1), 10_000).unref();
  await closeDb().catch(() => {});
  clearTimeout(force);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
