// Tiny hash router: the screen lives in `location.hash` (e.g.
// `#/classes/11/<classId>/<studentId>`) so refresh and the browser's back
// button keep you where you were.

import { useSyncExternalStore } from "react";

const EVENT = "labbench:route";

function subscribe(cb) {
  window.addEventListener("hashchange", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(EVENT, cb);
  };
}

const snapshot = () => window.location.hash;

export function parseRoute(hash) {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path
    .split("/")
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
  return { parts, query: new URLSearchParams(query), path: "/" + parts.join("/") };
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, snapshot, snapshot);
  return parseRoute(hash);
}

/** Build a path from segments, encoding each one. */
export const path = (...segments) =>
  "/" + segments.filter((s) => s !== undefined && s !== null && s !== "").map((s) => encodeURIComponent(String(s))).join("/");

export function navigate(to, { replace = false } = {}) {
  const url = "#" + to;
  if (replace) {
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(EVENT));
  } else if (window.location.hash !== url) {
    window.location.hash = to;
  }
}

/** onClick handler for in-app links rendered as <a href="#/...">. */
export const go = (to) => (e) => {
  if (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let new-tab clicks through
    e.preventDefault();
    e.stopPropagation();
  }
  navigate(to);
};
