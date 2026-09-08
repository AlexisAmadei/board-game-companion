import { query } from '../db.js';

// Every mutation below is a SINGLE statement. Postgres gives statement-level
// atomicity under READ COMMITTED for free, which is what replaces the accidental
// atomicity the old synchronous better-sqlite3 handlers relied on. No explicit
// transactions, no SELECT ... FOR UPDATE: there is no invariant in this app that
// spans two rows and is not already covered by one statement plus a constraint.
//
// The 404-vs-409 distinction the frontend branches on is produced inside the
// statement via data-modifying CTEs. A data-modifying CTE always runs to
// completion whether or not the outer query reads its output, so the EXISTS
// checks below do not short-circuit the write.

// Rebuilds the exact room document the frontend expects.
//
// json_build_object (NOT jsonb) preserves argument order, so the key order here
// matches the object literal the old backend returned:
//   name, createdAt, gameId, status, votingPhase, players, messages
// createdAt is bigint -> to_json -> unquoted JSON number; node-postgres parses
// the json column with JSON.parse, so it arrives as a JS number with no type
// parser needed. (A timestamptz would arrive as a Date and serialise to a
// string, and a bare bigint column would arrive as a string.)
const SELECT_ROOM = `
  SELECT json_build_object(
    'name',      r.name,
    'createdAt', r.created_at_ms,
    'gameId',    r.game_id,
    'status',    r.status,
    'votingPhase', json_build_object(
      'inProgress', ph.in_progress,
      'votes',      COALESCE(v.votes, '{}'::json),
      'totalVotes', v.total
    ),
    'players',  COALESCE(p.players,  '[]'::json),
    'messages', COALESCE(m.messages, '[]'::json)
  ) AS room
  FROM rooms r
  CROSS JOIN LATERAL (
    SELECT vp.id, vp.in_progress
    FROM voting_phases vp
    WHERE vp.room_id = r.game_id
    ORDER BY vp.id DESC
    LIMIT 1
  ) ph
  LEFT JOIN LATERAL (
    SELECT json_agg(pl.name ORDER BY pl.id) AS players
    FROM players pl WHERE pl.room_id = r.game_id
  ) p ON true
  LEFT JOIN LATERAL (
    -- json_strip_nulls reproduces the old {} for a message posted with no
    -- fields: the API never validated these and JSON.stringify dropped
    -- undefined values.
    SELECT json_agg(
             json_strip_nulls(
               json_build_object('userName', ms.user_name, 'content', ms.content)
             ) ORDER BY ms.id
           ) AS messages
    FROM messages ms WHERE ms.room_id = r.game_id
  ) m ON true
  LEFT JOIN LATERAL (
    SELECT json_object_agg(vo.player_name, vo.vote) AS votes,
           count(*)::int                            AS total
    FROM votes vo WHERE vo.phase_id = ph.id
  ) v ON true
  WHERE r.game_id = $1
`;

export async function findRoom(gameId) {
  const { rows } = await query(SELECT_ROOM, [gameId]);
  return rows[0]?.room ?? null;
}

// Inserts the room and its initial voting phase. The phase exists from the
// start so `votingPhase` is never absent and a vote always has somewhere to go,
// exactly as the old JSON blob always carried the object.
// Returns false on a game_id collision so the caller can retry with a new id.
export async function insertRoom({ gameId, name, createdAtMs }) {
  const { rows } = await query(
    `
    WITH room AS (
      INSERT INTO rooms (game_id, name, created_at_ms)
      VALUES ($1, $2, $3)
      ON CONFLICT (game_id) DO NOTHING
      RETURNING game_id
    ), phase AS (
      INSERT INTO voting_phases (room_id, in_progress)
      SELECT game_id, false FROM room
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM room) AS created
    `,
    [gameId, name, createdAtMs],
  );
  return rows[0].created;
}

// { roomExists, inserted } -> 404 / 409 / 200
export async function insertPlayer(gameId, playerName) {
  const { rows } = await query(
    `
    WITH room AS (
      SELECT game_id FROM rooms WHERE game_id = $1
    ), ins AS (
      INSERT INTO players (room_id, name)
      SELECT room.game_id, $2 FROM room
      ON CONFLICT (room_id, name) DO NOTHING
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM room) AS room_exists,
           EXISTS (SELECT 1 FROM ins)  AS inserted
    `,
    [gameId, playerName],
  );
  return { roomExists: rows[0].room_exists, inserted: rows[0].inserted };
}

// Idempotent, matching the old `players.filter(...)`. Deliberately does not
// touch votes: the old backend left a kicked player's vote in place.
export async function deletePlayer(gameId, playerName) {
  const { rows } = await query(
    `
    WITH room AS (
      SELECT game_id FROM rooms WHERE game_id = $1
    ), del AS (
      DELETE FROM players
      WHERE room_id = (SELECT game_id FROM room) AND name = $2
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM room) AS room_exists
    `,
    [gameId, playerName],
  );
  return rows[0].room_exists;
}

export async function insertMessage(gameId, userName, content) {
  const { rowCount } = await query(
    `
    INSERT INTO messages (room_id, user_name, content)
    SELECT game_id, $2, $3 FROM rooms WHERE game_id = $1
    RETURNING 1
    `,
    [gameId, userName ?? null, content ?? null],
  );
  return rowCount > 0;
}

// A new phase supersedes the old one, which is how "start resets the votes"
// becomes atomic: the previous round's votes are still on disk but no longer
// reachable, so there is no delete for a concurrent vote to slip past.
export async function startVotingPhase(gameId) {
  const { rowCount } = await query(
    `
    INSERT INTO voting_phases (room_id, in_progress)
    SELECT game_id, true FROM rooms WHERE game_id = $1
    RETURNING 1
    `,
    [gameId],
  );
  return rowCount > 0;
}

// Only flips the flag; the votes stay readable, which is what
// Display.calculateResults() relies on after stopping.
export async function stopVotingPhase(gameId) {
  const { rowCount } = await query(
    `
    UPDATE voting_phases SET in_progress = false
    WHERE id = (
      SELECT vp.id FROM voting_phases vp
      WHERE vp.room_id = $1
      ORDER BY vp.id DESC
      LIMIT 1
    )
    RETURNING 1
    `,
    [gameId],
  );
  return rowCount > 0;
}

// The phase is read and the vote written in one statement and one snapshot, so
// a vote can never be filed against a phase that was already superseded at read
// time. Concurrent voters are independent inserts against a composite primary
// key: no lost updates, no locking, no retries.
export async function insertVote(gameId, playerName, vote) {
  const { rows } = await query(
    `
    WITH room AS (
      SELECT game_id FROM rooms WHERE game_id = $1
    ), phase AS (
      SELECT vp.id FROM voting_phases vp
      WHERE vp.room_id = (SELECT game_id FROM room)
      ORDER BY vp.id DESC
      LIMIT 1
    ), ins AS (
      INSERT INTO votes (phase_id, player_name, vote)
      SELECT phase.id, $2, $3 FROM phase
      ON CONFLICT (phase_id, player_name) DO NOTHING
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM room) AS room_exists,
           EXISTS (SELECT 1 FROM ins)  AS inserted
    `,
    [gameId, playerName, vote],
  );
  return { roomExists: rows[0].room_exists, inserted: rows[0].inserted };
}

// ON DELETE CASCADE sweeps players, messages, voting_phases and votes.
export async function deleteRoomsOlderThan(timestampMs) {
  const { rowCount } = await query('DELETE FROM rooms WHERE created_at_ms < $1', [timestampMs]);
  return rowCount;
}
