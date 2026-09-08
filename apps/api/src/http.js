// Express 4 does not catch rejections from async handlers: without this wrapper
// a failed query leaves the request hanging until the client times out.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const ROOM_NOT_FOUND = 'Partie non trouvée.';

// Must be registered last, and must take four arguments for Express to treat it
// as error middleware.
export function errorMiddleware(err, _req, res, _next) {
  console.error('[api]', err);
  if (res.headersSent) return res.end();
  // Same { error } shape config/api.js reads, so an unexpected failure surfaces
  // as a French message rather than the generic "Request failed".
  res.status(500).json({ error: 'Erreur serveur.' });
}
