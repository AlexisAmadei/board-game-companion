// Minimal Server-Sent Events hub. Clients open an EventSource per room and
// receive the full room state on every change.
//
// State is in-process, so the API must run as a SINGLE replica. On Dokploy that
// means forcing Order: "stop-first" in the swarm update config; the default
// "start-first" briefly runs two containers and SSE clients pinned to the old
// one would silently miss every mutation landing on the new one.
const subscribers = new Map(); // gameId -> Set<res>

export function addSubscriber(gameId, res) {
  if (!subscribers.has(gameId)) subscribers.set(gameId, new Set());
  subscribers.get(gameId).add(res);
}

export function removeSubscriber(gameId, res) {
  const set = subscribers.get(gameId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) subscribers.delete(gameId);
}

// Push the current room state to every client subscribed to that room.
export function broadcast(gameId, room) {
  const set = subscribers.get(gameId);
  if (!set) return;
  const payload = `data: ${JSON.stringify(room)}\n\n`;
  for (const res of set) res.write(payload);
}

// Every open SSE response is a live socket, so server.close() never resolves
// while one is held. Shutdown must end them explicitly. Browsers reconnect an
// EventSource automatically (~3s), so this is invisible to players.
export function closeAllSubscribers() {
  for (const set of subscribers.values()) {
    for (const res of set) res.end();
  }
  subscribers.clear();
}
