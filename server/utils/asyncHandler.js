// Express 4 doesn't catch rejected promises from async route handlers on its
// own — an unhandled rejection there crashes the process instead of hitting
// the error middleware. Wrap every async handler with this.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
