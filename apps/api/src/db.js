import pg from 'pg';
import { config } from './config.js';

// No `ssl` option: on Dokploy the API and Postgres share a private overlay
// network, and locally it is a container on the same host.
export const pool = new pg.Pool({
  ...(config.databaseUrl ? { connectionString: config.databaseUrl } : {}),
  max: 10,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 5_000,
  application_name: 'board-game-companion-api',
});

// Mandatory: an error raised on an idle client is emitted on the pool, and an
// unhandled 'error' event takes the process down.
pool.on('error', (err) => console.error('[pg] idle client error', err));

export const query = (text, values) => pool.query(text, values);

// Retries a fn with backoff. Used at boot so a database that is still starting
// up does not hard-fail a deploy.
export async function withRetry(fn, { attempts = 10, label = 'operation' } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts) throw err;
      const delay = Math.min(1000 * attempt, 10_000);
      console.warn(`[db] ${label} failed (attempt ${attempt}/${attempts}), retrying in ${delay}ms:`, err.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function healthCheck() {
  await pool.query('SELECT 1');
}

export const close = () => pool.end();
