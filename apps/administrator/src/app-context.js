import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * App-wide context: { user, school, role, roleLabel, canEdit, logout,
 * toast(msg, kind), version, refresh(), openAssign(opts) }.
 */
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

/**
 * Loads data with `fn` whenever `deps` change or the app's data version is
 * bumped (after an assign, etc). Keeps the previous data while refreshing
 * the same key so screens don't flash.
 */
export function useApi(fn, deps = []) {
  const app = useContext(AppContext);
  const version = app?.version ?? 0;
  const key = JSON.stringify(deps);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key, data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => (s.key === key ? { ...s, loading: true } : { key, data: null, error: null, loading: true }));
    fnRef.current().then(
      (data) => alive && setState({ key, data, error: null, loading: false }),
      (error) => alive && setState((s) => ({ key, data: s.key === key ? s.data : null, error, loading: false })),
    );
    return () => {
      alive = false;
    };
  }, [key, version, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state.key === key ? state : { data: null, error: null, loading: true };
  return { ...current, reload };
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
