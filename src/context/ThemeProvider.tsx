"use client";
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { usePersistentState, writeStored } from "@/hooks/usePersistentState";
import { DEFAULT_PALETTE, PALETTE_IDS, type PaletteId } from "@/lib/palettes";

export type Mode = "light" | "dark" | "system";
const MODES: readonly Mode[] = ["light", "dark", "system"];
const MODE_KEY = "vb-theme";
const PALETTE_KEY = "vb-palette";

// Runs in <head> before first paint, so the right mode and palette are on
// <html> before anything renders (no flash).
export const themeInitScript = `(function(){try{var d=document.documentElement;var m=localStorage.getItem("${MODE_KEY}");var dark=m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light";var p=localStorage.getItem("${PALETTE_KEY}");if(p!=="${DEFAULT_PALETTE}"&&${JSON.stringify(PALETTE_IDS)}.indexOf(p)>-1)d.dataset.palette=p;}catch(e){}})()`;

// The DOM (set by the init script, then by our setters) is the source of
// truth for what's currently applied.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((l) => l());
const getResolved = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getPalette = () => (document.documentElement.dataset.palette as PaletteId | undefined) ?? DEFAULT_PALETTE;

const systemQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function applyDark(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  notify();
}

interface ThemeState {
  /** What the user chose. */
  mode: Mode;
  /** What's applied right now. */
  resolved: "light" | "dark";
  palette: PaletteId;
  setMode: (m: Mode) => void;
  setPalette: (p: PaletteId) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, storeMode] = usePersistentState<Mode>(MODE_KEY, "system", MODES);
  const resolved = useSyncExternalStore(subscribe, getResolved, () => "light" as const);
  const palette = useSyncExternalStore(subscribe, getPalette, () => DEFAULT_PALETTE);

  // In System mode, follow the OS when it switches between light and dark.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = systemQuery();
    const onChange = () => applyDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback(
    (m: Mode) => {
      storeMode(m);
      applyDark(m === "dark" || (m === "system" && systemQuery().matches));
    },
    [storeMode],
  );

  const setPalette = useCallback((p: PaletteId) => {
    writeStored(PALETTE_KEY, p);
    const root = document.documentElement;
    if (p === DEFAULT_PALETTE) delete root.dataset.palette;
    else root.dataset.palette = p;
    notify();
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, palette, setMode, setPalette }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
