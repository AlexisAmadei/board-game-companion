-- One room = one game. game_id is the 5-char base36 join code and the PK.
CREATE TABLE rooms (
  game_id       text    PRIMARY KEY,
  name          text    NOT NULL,
  -- Epoch milliseconds, NOT timestamptz: node-postgres hands back a JS Date
  -- for timestamptz and res.json() would serialise it as an ISO string,
  -- breaking the `createdAt` contract. bigint -> to_json() -> JSON number.
  created_at_ms bigint  NOT NULL,
  status        text    NOT NULL DEFAULT 'waiting'
);

CREATE INDEX rooms_created_at_ms_idx ON rooms (created_at_ms);

-- Player identity IS the name; the frontend keys everything by it.
CREATE TABLE players (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- insertion order
  room_id text NOT NULL REFERENCES rooms (game_id) ON DELETE CASCADE,
  name    text NOT NULL,
  -- Encodes the 409 "Joueur deja present dans la partie." rule. Plain text,
  -- byte-exact: mirrors Array.prototype.includes on the frontend.
  CONSTRAINT players_room_name_key UNIQUE (room_id, name)
);

CREATE INDEX players_room_id_id_idx ON players (room_id, id);

CREATE TABLE messages (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- insertion order
  room_id   text NOT NULL REFERENCES rooms (game_id) ON DELETE CASCADE,
  -- Nullable on purpose: the API does not validate these, and json_strip_nulls
  -- reproduces today's `{}` payload for a message posted with no fields.
  user_name text,
  content   text
);

CREATE INDEX messages_room_id_id_idx ON messages (room_id, id);

-- A room always owns at least one phase, created with the room, so votingPhase
-- is never absent. POST /voting/start inserts a NEW phase rather than deleting
-- votes: a fresh phase id makes the previous round's votes invisible, with no
-- delete to race against. The current phase is the highest id for the room.
CREATE TABLE voting_phases (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id     text    NOT NULL REFERENCES rooms (game_id) ON DELETE CASCADE,
  in_progress boolean NOT NULL DEFAULT true
);

CREATE INDEX voting_phases_room_idx ON voting_phases (room_id, id DESC);

-- DELIBERATE: votes reference the phase, never the players table. Kicking a
-- player leaves their vote in votingPhase.votes and leaves totalVotes alone
-- (verified against the old backend). A cascade from players would silently
-- change gameplay: Display.jsx ends the phase when voteCount === playerCount.
CREATE TABLE votes (
  phase_id    bigint NOT NULL REFERENCES voting_phases (id) ON DELETE CASCADE,
  player_name text   NOT NULL,
  -- No CHECK on vote: the current API accepts any string and returns 200.
  vote        text   NOT NULL,
  -- Encodes the 409 "Vous avez deja vote." rule, scoped to the phase.
  PRIMARY KEY (phase_id, player_name)
);
