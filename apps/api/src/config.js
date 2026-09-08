// Environment parsing, validated once at boot so a misconfigured deploy fails
// loudly instead of on the first request.

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number, got "${raw}"`);
  return value;
}

// Either DATABASE_URL or the discrete PG* variables. The discrete form is the
// escape hatch for passwords containing characters that would corrupt a URL.
const databaseUrl = process.env.DATABASE_URL || '';
const hasDiscretePgVars = Boolean(process.env.PGHOST || process.env.PGDATABASE);

if (!databaseUrl && !hasDiscretePgVars) {
  throw new Error(
    'No database configured. Set DATABASE_URL (e.g. postgresql://user:pass@host:5432/db) ' +
      'or the discrete PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE variables.',
  );
}

export const config = {
  port: intFromEnv('PORT', 3001),
  // Comma-separated allowlist (e.g. the Vercel frontend URL).
  allowedOrigins: (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim()),
  databaseUrl,
  roomTtlMs: intFromEnv('ROOM_TTL_HOURS', 48) * 60 * 60 * 1000,
  // Optional delay before the first SSE frame. JoinRoom.jsx fires joinRoom()
  // and opens the EventSource in the same tick without awaiting; if the
  // subscribe wins the race, the first frame lacks the player and the client
  // redirects itself out of the room. Defaults to 0 (the pool is pre-warmed,
  // which keeps the window at roughly the old SQLite size). Raise it to ~100
  // only if that alert is ever seen in production.
  sseInitialDelayMs: intFromEnv('SSE_INITIAL_DELAY_MS', 0),
};
