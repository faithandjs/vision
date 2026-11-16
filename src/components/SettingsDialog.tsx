"use client";
import { useEffect, useRef } from "react";
import { LuCheck, LuMonitor, LuMoon, LuSun, LuX } from "react-icons/lu";
import { useTheme, type Mode } from "@/context/ThemeProvider";
import { PALETTES } from "@/lib/palettes";
import ProfileSection from "./ProfileSection";

const MODE_OPTIONS: { value: Mode; label: string; Icon: typeof LuSun }[] = [
  { value: "light", label: "Light", Icon: LuSun },
  { value: "dark", label: "Dark", Icon: LuMoon },
  { value: "system", label: "System", Icon: LuMonitor },
];

/** Mounted only while open. Changes apply instantly and are saved on this device. */
export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { mode, resolved, palette, setMode, setPalette } = useTheme();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="settings-title"
      className="no-scrollbar m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border-0 bg-surface p-0 text-ink shadow-2xl ring-1 ring-line"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="settings-title" className="font-display text-3xl">
          Settings
        </h2>
        <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close settings">
          <LuX size={18} />
        </button>
      </div>

      <div className="space-y-8 px-6 py-6">
        <section>
          <h3 className="eyebrow mb-3">Profile</h3>
          <ProfileSection />
        </section>

        <section>
          <h3 className="eyebrow mb-3">Mode</h3>
          <div role="radiogroup" aria-label="Mode" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-1">
            {MODE_OPTIONS.map(({ value, label, Icon }) => {
              const active = mode === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(value)}
                  className={
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition " +
                    (active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")
                  }
                >
                  <Icon size={16} /> {label}
                </button>
              );
            })}
          </div>
          {mode === "system" && (
            <p className="mt-2 text-xs text-muted">Follows your device. It&apos;s {resolved} right now.</p>
          )}
        </section>

        <section>
          <h3 className="eyebrow mb-3">Theme</h3>
          <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PALETTES.map((p) => {
              const active = palette === p.id;
              const c = p[resolved];
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPalette(p.id)}
                  className={
                    "group relative overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 " +
                    (active ? "border-accent-deep ring-2 ring-accent-deep/40" : "border-line hover:border-muted/60")
                  }
                >
                  {/* Mini preview of the palette in the current mode */}
                  <div className="relative h-20 p-3" style={{ background: c.bg }}>
                    <span className="block h-2 w-14 rounded-full opacity-60" style={{ background: c.deep }} />
                    <span className="mt-2 block h-2 w-9 rounded-full opacity-35" style={{ background: c.deep }} />
                    <span
                      className="absolute right-3 bottom-3 h-6 w-12 rounded-full"
                      style={{ background: c.accent }}
                    />
                    <span
                      className="absolute bottom-3.5 left-3 size-4 rounded-full"
                      style={{ background: c.deep }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2.5">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {active && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-deep text-surface">
                        <LuCheck size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
        <p className="text-xs text-muted">Saved on this device.</p>
        <button onClick={onClose} className="btn-primary px-5">
          Done
        </button>
      </div>
    </dialog>
  );
}
