// Minimal Server-Sent Events hub. Replaces Firestore's onSnapshot: clients
// open an EventSource per room and receive the full room state on every change.
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
