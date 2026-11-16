"use client";
import { LuCheck, LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { useTheme, type Mode } from "@/context/ThemeProvider";
import { PALETTES } from "@/lib/palettes";

const MODE_OPTIONS: { value: Mode; label: string; Icon: typeof LuSun }[] = [
  { value: "light", label: "Light", Icon: LuSun },
  { value: "dark", label: "Dark", Icon: LuMoon },
  { value: "system", label: "System", Icon: LuMonitor },
];

/** Mode and theme pickers. Changes apply instantly and are saved on this device. */
export default function AppearanceSettings() {
  const { mode, resolved, palette, setMode, setPalette } = useTheme();
  return (
    <div className="space-y-4">
      <section>
        <h3 className="eyebrow mb-2">Mode</h3>
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
        <h3 className="eyebrow mb-2">Theme</h3>
        <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-2 gap-2">
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
                <div className="relative h-14 p-2.5" style={{ background: c.bg }}>
                  <span className="block h-2 w-14 rounded-full opacity-60" style={{ background: c.deep }} />
                  <span className="mt-2 block h-2 w-9 rounded-full opacity-35" style={{ background: c.deep }} />
                  <span className="absolute right-3 bottom-3 h-6 w-12 rounded-full" style={{ background: c.accent }} />
                  <span className="absolute bottom-3.5 left-3 size-4 rounded-full" style={{ background: c.deep }} />
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
  );
}
