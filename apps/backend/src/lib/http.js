/** Wraps an async route so a thrown error reaches the Express error handler. */
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Error with an HTTP status; the error handler turns it into JSON. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const round1 = (n) => Math.round(n * 10) / 10;

export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export const avg = (values) => {
  const list = values.filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
};

export const initialsOf = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
