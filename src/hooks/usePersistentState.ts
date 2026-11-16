"use client";
import { useCallback, useSyncExternalStore } from "react";

// Small localStorage-backed state that is safe during server rendering
// (returns the fallback there) and stays in sync across components and tabs.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function usePersistentState<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {}
      notify();
    },
    [key],
  );

  return [value, setValue] as const;
}
