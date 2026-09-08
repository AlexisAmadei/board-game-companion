import { readdir, readFile } from 'node:fs/promises';
import { pool } from './db.js';

const MIGRATIONS_DIR = new URL('../migrations/', import.meta.url);
// Arbitrary but stable: two containers booting at once must not race.
const LOCK_KEY = '4207318521';

export async function migrate() {
  const client = await pool.connect();
  try {
    // Take the lock before anything else, so concurrent boots cannot even race
    // on creating schema_migrations itself.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.version));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(new URL(file, MIGRATIONS_DIR), 'utf8');
      await client.query('BEGIN');
      try {
        // No parameter array: that keeps this on the simple query protocol,
        // which is what allows multiple statements in one migration file.
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[migrate] applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`, { cause: err });
      }
    }
  } finally {
    // Must be released on the same pooled client that took it.
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    client.release();
  }
}

// `pnpm --filter @board-game-companion/api migrate`
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await migrate();
    console.log('[migrate] up to date');
    process.exit(0);
  } catch (err) {
    console.error('[migrate]', err);
    process.exit(1);
  }
}
