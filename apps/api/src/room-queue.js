// Serialises the read-and-broadcast tail of each mutation, per room.
//
// The old backend was synchronous, so SSE frames were emitted in mutation
// order. With awaits, two concurrent mutations can have their read queries
// complete out of order and a client can receive an older full state after a
// newer one. That matters: JoinRoom.jsx:84 alerts and redirects a player whose
// name is missing from a frame, so one stale frame ejects them from the game.
//
// Mutations themselves stay outside the queue; Postgres already serialises
// those. Only the snapshot-and-broadcast is ordered here.
const chains = new Map();

export function withRoomQueue(gameId, fn) {
  const previous = chains.get(gameId) || Promise.resolve();
  const run = previous.then(fn, fn);
  const settled = run.then(
    () => {},
    () => {},
  );
  chains.set(gameId, settled);
  settled.then(() => {
    if (chains.get(gameId) === settled) chains.delete(gameId);
  });
  return run;
}
