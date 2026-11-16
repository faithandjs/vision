"use client";
import { LuImages, LuLayoutGrid, LuNotebookPen, LuRefreshCw } from "react-icons/lu";
import type { ViewMode } from "@/lib/types";

const options = [
  { value: "cards", label: "Cards", Icon: LuLayoutGrid },
  { value: "collage", label: "Collage", Icon: LuImages },
  { value: "journal", label: "Journal", Icon: LuNotebookPen },
] as const;

/**
 * Cards | Collage | Journal switcher. While Cards is selected, a "Flip all" sub-button
 * is attached to the Cards pill.
 */
export default function ViewSwitcher({
  value,
  onChange,
  flip,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  /** Pass to show the Flip all sub-button on the Cards pill. */
  flip?: { allFlipped: boolean; onToggle: () => void };
}) {
  return (
    <div role="radiogroup" aria-label="Board view" className="flex items-center rounded-full border border-line bg-surface p-1">
      {options.map(({ value: v, label, Icon }) => {
        const active = v === value;
        const withFlip = active && v === "cards" && flip;
        return (
          <div
            key={v}
            className={
              "flex items-center rounded-full transition " + (active ? "bg-ink text-bg shadow-sm" : "text-muted")
            }
          >
            <button
              role="radio"
              aria-checked={active}
              aria-label={label}
              onClick={() => onChange(v)}
              className={
                "flex items-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition " +
                (withFlip ? "pr-2 pl-3" : "px-3") +
                (active ? "" : " hover:text-ink")
              }
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
            {withFlip && (
              <>
                <span aria-hidden className="h-4 w-px bg-bg/25" />
                <button
                  type="button"
                  onClick={flip.onToggle}
                  aria-pressed={flip.allFlipped}
                  aria-label={flip.allFlipped ? "Show card fronts" : "Flip all cards"}
                  title={flip.allFlipped ? "Show fronts" : "Flip all"}
                  className={
                    "grid size-7 place-items-center rounded-full transition-colors hover:text-accent-on-ink " +
                    (flip.allFlipped ? "text-accent-on-ink" : "")
                  }
                >
                  <LuRefreshCw
                    size={14}
                    className={"transition-transform duration-500 " + (flip.allFlipped ? "rotate-180" : "")}
                  />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
