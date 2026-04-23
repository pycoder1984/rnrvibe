"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

// Same-document writes to localStorage don't fire "storage" events — we dispatch a
// custom event so other hook instances bound to the same key stay in sync.
const CHANGE_EVENT = "rnrvibe-ls-change";

function notifyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// A parallel store whose only job is to tell us whether we're past the first
// client render. useSyncExternalStore returns the server snapshot during SSR
// and initial hydration, then swaps to the client snapshot — which gives us a
// hydration flag with zero setState-in-effect.
const hydratedSubscribe = () => () => {};
const hydratedClient = () => true;
const hydratedServer = () => false;

function readCurrent<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return initial;
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

/**
 * SSR-safe localStorage-backed state. Unlike useState + useEffect the hook matches
 * the server snapshot on first client render (no hydration mismatch) and never
 * calls setState from inside an effect body.
 *
 * Returns [value, setValue, hydrated].
 *   - During SSR and the hydration pass, `value` is `getInitial()` and `hydrated` is false.
 *   - After hydration, `value` reflects localStorage (or `getInitial()` when the key
 *     is absent or the stored JSON is malformed) and `hydrated` is true.
 *   - setValue writes through to localStorage and notifies all other hook instances
 *     bound to the same key within the same document.
 */
export function useLocalStorageState<T>(
  key: string,
  getInitial: () => T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  // Lazy-init via useState so getInitial() runs exactly once per hook instance —
  // important for defaults that mint IDs or random data.
  const [initial] = useState(getInitial);

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(hydratedSubscribe, hydratedClient, hydratedServer);

  let value: T;
  if (!hydrated || raw === null) {
    value = initial;
  } else {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      // Re-read from localStorage instead of relying on closed-over state — this
      // keeps functional updates correct even if setValue is called multiple times
      // in the same tick (e.g. both trigger before React re-renders).
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(readCurrent(key, initial))
          : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota exceeded / blocked — swallow and let the next notifyChange keep state coherent.
      }
      notifyChange();
    },
    [key, initial]
  );

  return [value, setValue, hydrated];
}
