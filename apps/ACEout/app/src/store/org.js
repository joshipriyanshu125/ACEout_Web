import { KEYS, readJSON, writeJSON, removeKey } from './storage';
import * as api from '../api/org';

/**
 * School/College mode on the device: the chosen mode, the signed-in session,
 * cached server responses (so the dashboard opens offline) and the outbox of
 * lab submissions waiting for a connection.
 *
 * Caches and the outbox are tagged with the user id, so a second student
 * signing in on the same phone never sees — or sends — the first one's.
 */

// --- mode + session ---------------------------------------------------------

export async function loadMode() {
  const stored = await readJSON(KEYS.mode, null);
  return stored?.mode === 'org' || stored?.mode === 'guest' ? stored.mode : null;
}

export const saveMode = (mode) => writeJSON(KEYS.mode, { mode });

export async function loadSession() {
  const s = await readJSON(KEYS.orgSession, null);
  return s && typeof s.token === 'string' && s.user ? s : null;
}

export const saveSession = (session) => writeJSON(KEYS.orgSession, session);

export async function clearSession() {
  await Promise.all([
    removeKey(KEYS.orgSession),
    removeKey(KEYS.orgDashboard),
    removeKey(KEYS.orgLabs),
  ]);
}

// --- response cache ---------------------------------------------------------

export async function readCache(key, userId) {
  const c = await readJSON(key, null);
  return c && c.userId === userId ? c : null;
}

export const writeCache = (key, userId, data) =>
  writeJSON(key, { userId, at: Date.now(), data });

/** Results kept on the phone so a completed lab can show its quiz review. */
export async function saveResult(userId, labId, result) {
  const all = await readJSON(KEYS.orgResults, {});
  all[`${userId}:${labId}`] = { ...result, savedAt: Date.now() };
  await writeJSON(KEYS.orgResults, all);
}

export async function loadResult(userId, labId) {
  const all = await readJSON(KEYS.orgResults, {});
  return all[`${userId}:${labId}`] || null;
}

// --- outbox -----------------------------------------------------------------

export async function readOutbox(userId) {
  const box = await readJSON(KEYS.orgOutbox, { items: [] });
  const items = Array.isArray(box.items) ? box.items : [];
  return userId ? items.filter((i) => i.userId === userId) : items;
}

export async function enqueue(userId, labId, title, payload) {
  const box = await readJSON(KEYS.orgOutbox, { items: [] });
  const items = (Array.isArray(box.items) ? box.items : []).filter(
    (i) => !(i.userId === userId && i.labId === labId)
  );
  items.push({ userId, labId, title, payload, queuedAt: Date.now() });
  await writeJSON(KEYS.orgOutbox, { items });
}

async function dequeue(userId, labId) {
  const box = await readJSON(KEYS.orgOutbox, { items: [] });
  const items = (Array.isArray(box.items) ? box.items : []).filter(
    (i) => !(i.userId === userId && i.labId === labId)
  );
  await writeJSON(KEYS.orgOutbox, { items });
}

/**
 * Submit one lab. 201 and 409 (already submitted — a replay of a queued
 * submission that did get through) are both success.
 */
export async function submitLab(session, labId, payload) {
  try {
    const res = await api.completeLab(session.token, labId, payload);
    const result = res?.result || {};
    await saveResult(session.user.id, labId, result);
    return { result, duplicate: false };
  } catch (e) {
    if (e.status === 409 && e.body?.result) {
      const prior = await loadResult(session.user.id, labId);
      const result = { ...e.body.result, review: prior?.review?.length ? prior.review : [] };
      return { result, duplicate: true };
    }
    throw e;
  }
}

let flushing = null;

/**
 * Replay queued submissions. Stops at the first network failure (still
 * offline); drops an item the server refuses outright (403/404/400), since a
 * retry would only be refused again.
 */
export function flushOutbox(session) {
  if (!session?.token) return Promise.resolve({ sent: 0, left: 0 });
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    const items = await readOutbox(session.user.id);
    for (const item of items) {
      try {
        await submitLab(session, item.labId, item.payload);
        await dequeue(session.user.id, item.labId);
        sent += 1;
      } catch (e) {
        if (e.network || e.status === 401 || e.status >= 500) break;
        await dequeue(session.user.id, item.labId);
      }
    }
    const left = (await readOutbox(session.user.id)).length;
    return { sent, left };
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
