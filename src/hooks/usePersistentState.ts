"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

// localStorage-backed state that is safe during server rendering (returns the
// fallback there), stays in sync across components and tabs, and keeps
// working in memory when storage is unavailable (e.g. some private modes).
const memory = new Map<string, string>();
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
  if (memory.has(key)) return memory.get(key)!;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes (or with `null`, removes) a stored value and notifies subscribers. */
export function writeStored(key: string, value: string | null) {
  if (value === null) {
    memory.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {}
  } else {
    memory.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
  notify();
}

export const readStored = read;
const write = writeStored;

/** The raw stored string for `key` (null on the server or when absent). */
export function useStored(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}

/** A persisted string limited to a known set of values. */
export function usePersistentState<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const raw = useStored(key);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const setValue = useCallback((next: T) => write(key, next), [key]);
  return [value, setValue] as const;
}

/** A persisted object, merged over `fallback` so new fields get defaults. Pass a stable `fallback`. */
export function usePersistentObject<T extends object>(key: string, fallback: T) {
  const raw = useStored(key);
  const value = useMemo<T>(() => {
    if (!raw) return fallback;
    try {
      return { ...fallback, ...JSON.parse(raw) };
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
  const setValue = useCallback((next: T) => write(key, JSON.stringify(next)), [key]);
  return [value, setValue] as const;
}
