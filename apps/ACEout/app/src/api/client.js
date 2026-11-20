/**
 * The one door to the school's server (School/College mode only — guest mode
 * never imports this).
 *
 * Every call gets a timeout, JSON errors come back as readable messages, and a
 * 401 on an authenticated call signs the student out to the org login via the
 * handler OrgState registers.
 */

const DEFAULT_BASE = 'http://localhost:5000';
const TIMEOUT_MS = 10000;

// Expo inlines EXPO_PUBLIC_* only for direct `process.env.NAME` access.
export const API_BASE = String(process.env.EXPO_PUBLIC_LAB_API_URL || DEFAULT_BASE).replace(
  /\/+$/,
  ''
);

export class ApiError extends Error {
  constructor(message, { status = 0, network = false, body = null } = {}) {
    super(message);
    this.status = status;
    this.network = network;
    this.body = body;
  }
}

let unauthorizedHandler = null;
/** OrgState sets this; a 401 on a call made with a token invokes it. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export async function request(path, { method = 'GET', body, token, timeout = TIMEOUT_MS } = {}) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller?.abort();
  }, timeout);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });
  } catch {
    throw new ApiError(
      timedOut
        ? 'The school server took too long to answer. Check your connection.'
        : 'Could not reach the school server. Check your connection.',
      { network: true }
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `The server answered ${res.status}.`;
    if (res.status === 401 && token && unauthorizedHandler) {
      try {
        unauthorizedHandler(message);
      } catch {
        // never let the handler mask the original error
      }
    }
    throw new ApiError(message, { status: res.status, body: data });
  }
  return data;
}
