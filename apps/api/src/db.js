import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// SQLite file location. Defaults to ./data/app.db, overridable for Docker volumes.
const DB_PATH = process.env.DATABASE_PATH || new URL('../data/app.db', import.meta.url).pathname;
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Each room is stored as a JSON blob to preserve the exact document shape the
// frontend expects. `game_id` and `created_at` are kept as columns for lookups
// and TTL cleanup.
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    game_id    TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    data       TEXT NOT NULL
  );
`);

const statements = {
  insert: db.prepare('INSERT INTO rooms (game_id, created_at, data) VALUES (?, ?, ?)'),
  update: db.prepare('UPDATE rooms SET data = ? WHERE game_id = ?'),
  get: db.prepare('SELECT data FROM rooms WHERE game_id = ?'),
  exists: db.prepare('SELECT 1 FROM rooms WHERE game_id = ?'),
  deleteOlderThan: db.prepare('DELETE FROM rooms WHERE created_at < ?'),
};

export function roomExists(gameId) {
  return statements.exists.get(gameId) !== undefined;
}

export function getRoom(gameId) {
  const row = statements.get.get(gameId);
  return row ? JSON.parse(row.data) : null;
}

export function createRoom(room) {
  statements.insert.run(room.gameId, room.createdAt, JSON.stringify(room));
  return room;
}

export function saveRoom(room) {
  statements.update.run(JSON.stringify(room), room.gameId);
  return room;
}

export function deleteRoomsOlderThan(timestamp) {
  return statements.deleteOlderThan.run(timestamp).changes;
}

export default db;
