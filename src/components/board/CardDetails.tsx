"use client";
import { useId } from "react";
import { LuCheck } from "react-icons/lu";
import { cardProgress } from "@/lib/board";
import type { BoardCard } from "@/lib/types";

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={"h-1.5 overflow-hidden rounded-full bg-surface-muted " + className}
    >
      <div className="h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CardDetails({
  card,
  cardIndex,
  onToggle,
}: {
  card: BoardCard;
  cardIndex: number;
  onToggle: (cardIndex: number, itemIndex: number) => void;
}) {
  const id = useId();
  const { done, total } = cardProgress(card);

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      {card.p && <p className="font-display text-xl leading-snug text-ink/90 italic">{card.p}</p>}

      {card.list && (
        <section>
          {card.list.title && <h4 className="eyebrow mb-2">{card.list.title}</h4>}
          <ul className="space-y-1.5">
            {card.list.list.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.check && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="eyebrow">{card.check.title || "Checklist"}</h4>
            <span className="text-xs text-muted tabular-nums">
              {done}/{total}
            </span>
          </div>
          <ProgressBar value={done / total} className="mb-3" />
          <ul className="space-y-0.5">
            {card.check.list.map((item, i) => {
              const inputId = `${id}-${i}`;
              return (
                <li key={i}>
                  <label
                    htmlFor={inputId}
                    className="-mx-2 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface-muted"
                  >
                    <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggle(cardIndex, i)}
                        className="peer size-5 cursor-pointer appearance-none rounded-md border border-muted/50 bg-surface transition checked:border-success checked:bg-success"
                      />
                      <LuCheck
                        strokeWidth={3}
                        className="pointer-events-none absolute size-3.5 text-surface opacity-0 transition peer-checked:opacity-100"
                      />
                    </span>
                    <span className={"transition " + (item.checked ? "text-muted line-through decoration-muted/50" : "")}>
                      {item.value}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!card.p && !card.list && !card.check && <p className="text-muted">No details yet.</p>}
    </div>
  );
}
