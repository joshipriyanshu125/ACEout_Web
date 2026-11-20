import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Everything LabVR knows about a guest student lives on the device. Guest mode
 * makes no network calls — the labs are meant to run in a classroom with no
 * connection — so AsyncStorage is the whole backend. School/College mode
 * (src/api, src/store/org.js) talks to the school's server, and caches what it
 * needs here so it still opens offline.
 *
 * Reads never throw: a corrupt or missing record falls back to the default so
 * a bad write can't lock a student out of their own app.
 */

export const KEYS = {
  user: 'aceout.user.v1',
  progress: 'aceout.progress.v2',
  legacyProgress: 'aceout.progress.v1',
  game: 'aceout.game.v1',
  lang: 'aceout.lang.v1',

  // School/College mode. The guest records above are never touched by it, so
  // a student can sign in to their school and still keep their own bench log.
  mode: 'aceout.mode.v1', // 'guest' | 'org'
  orgSession: 'aceout.org.session.v1', // { token, user, school, class }
  orgDashboard: 'aceout.org.dashboard.v1', // { userId, at, data }
  orgLabs: 'aceout.org.labs.v1', // { userId, at, data }
  orgOutbox: 'aceout.org.outbox.v1', // { items: [...] }
  orgResults: 'aceout.org.results.v1', // { [userId:labId]: result }
};

export async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
