"use client";
import { LuImages, LuLayoutGrid } from "react-icons/lu";
import type { ViewMode } from "@/lib/types";

const options = [
  { value: "collage", label: "Collage", Icon: LuImages },
  { value: "cards", label: "Cards", Icon: LuLayoutGrid },
] as const;

export default function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Board view" className="flex rounded-full border border-line bg-surface p-1">
      {options.map(({ value: v, label, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => onChange(v)}
            className={
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (active ? "bg-ink text-bg shadow-sm" : "text-muted hover:text-ink")
            }
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
