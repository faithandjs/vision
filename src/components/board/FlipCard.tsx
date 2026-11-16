"use client";
import { LuListChecks, LuRotateCcw } from "react-icons/lu";
import CoverImage from "@/components/CoverImage";
import { cardProgress } from "@/lib/board";
import type { BoardCard } from "@/lib/types";
import CardDetails from "./CardDetails";

export default function FlipCard({
  card,
  index,
  flipped,
  onFlip,
  onToggle,
}: {
  card: BoardCard;
  index: number;
  flipped: boolean;
  onFlip: () => void;
  onToggle: (cardIndex: number, itemIndex: number) => void;
}) {
  const { done, total } = cardProgress(card);

  return (
    <div
      className="flip animate-rise aspect-[3/4]"
      data-flipped={flipped}
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <div className="flip-inner relative size-full">
        {/* Front */}
        <button
          type="button"
          onClick={onFlip}
          inert={flipped}
          aria-label={`${card.title}: show details`}
          className="flip-face group overflow-hidden rounded-3xl bg-surface-muted text-left shadow-lg ring-1 shadow-black/5 ring-line"
        >
          <CoverImage
            src={card.image.src}
            alt={card.image.alt}
            className="absolute inset-0 size-full transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            {total > 0 && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium tabular-nums backdrop-blur-md">
                <LuListChecks size={12} /> {done}/{total}
              </span>
            )}
            <h3 className="font-display text-3xl leading-tight">{card.title}</h3>
          </div>
        </button>

        {/* Back */}
        <div
          inert={!flipped}
          className="flip-face flip-back flex flex-col overflow-hidden rounded-3xl bg-surface shadow-xl ring-1 shadow-black/10 ring-line"
        >
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <CoverImage src={card.image.src} alt="" className="size-11 shrink-0 rounded-xl" />
            <h3 className="flex-1 font-display text-2xl leading-tight">{card.title}</h3>
            <button type="button" onClick={onFlip} className="icon-btn -mr-2" aria-label="Flip back">
              <LuRotateCcw size={16} />
            </button>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
            <CardDetails card={card} cardIndex={index} onToggle={onToggle} />
          </div>
        </div>
      </div>
    </div>
  );
}
