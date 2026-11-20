import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import * as api from '../api/org';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import { resetTo } from '../navigation';
import {
  loadMode,
  saveMode,
  loadSession,
  saveSession,
  clearSession,
  flushOutbox,
} from './org';

/**
 * School/College mode state: which mode the student chose, and — in org mode —
 * the signed-in session. Guest records (AppState) are never touched here, so
 * switching to a school account and back keeps the guest's bench log.
 */

const OrgContext = createContext(null);

export function OrgStateProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState(null);
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  useEffect(() => {
    let alive = true;
    Promise.all([loadMode(), loadSession()]).then(([m, s]) => {
      if (!alive) return;
      setModeState(m);
      setSession(s);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback(async (m) => {
    setModeState(m);
    await saveMode(m);
  }, []);

  /** Accepts the {token,user,school,class} the auth endpoints return. */
  const adopt = useCallback(async (payload) => {
    if (!payload?.token || !payload?.user) throw new ApiError('Unexpected answer from the server.');
    if (api.STAFF_ROLES.includes(payload.user.role) || payload.user.role !== 'STUDENT') {
      throw new ApiError(api.STAFF_MESSAGE, { status: 403 });
    }
    const next = {
      token: payload.token,
      user: payload.user,
      school: payload.school || null,
      class: payload.class || null,
      signedInAt: Date.now(),
    };
    await saveSession(next);
    await saveMode('org');
    setSession(next);
    setModeState('org');
    return next;
  }, []);

  const signIn = useCallback(
    async (email, password) => adopt(await api.login(email.trim(), password)),
    [adopt]
  );

  const join = useCallback(async (fields) => adopt(await api.register(fields)), [adopt]);

  /** Leaves org mode. Guest data stays; the mode falls back to guest. */
  const signOut = useCallback(async () => {
    await clearSession();
    await saveMode('guest');
    setSession(null);
    setModeState('guest');
  }, []);

  // A 401 on any authenticated call: the token is gone, back to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!sessionRef.current) return;
      signOut().then(() =>
        resetTo('OrgLogin', { notice: 'Your session ended. Please sign in again.' })
      );
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Coming back to the foreground is the moment a queued lab can go out.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active' && sessionRef.current) {
        flushOutbox(sessionRef.current).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  const isOrg = mode === 'org' && Boolean(session);

  const value = useMemo(
    () => ({ ready, mode, session, isOrg, setMode, signIn, join, signOut }),
    [ready, mode, session, isOrg, setMode, signIn, join, signOut]
  );
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used inside <OrgStateProvider>');
  return ctx;
}
