"use client";
import CoverImage from "@/components/CoverImage";
import { cardProgress } from "@/lib/board";
import type { BoardCard } from "@/lib/types";

// Varying tile shapes give the collage its scrapbook feel regardless of the
// source images' proportions.
const shapes = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-[2/3]", "aspect-[5/4]"];

export default function CollageView({ cards, onOpen }: { cards: BoardCard[]; onOpen: (index: number) => void }) {
  return (
    <div className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
      {cards.map((card, i) => {
        const { done, total } = cardProgress(card);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(i)}
            style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
            className={
              "group animate-rise relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-surface-muted text-left ring-1 ring-line sm:mb-4 " +
              shapes[i % shapes.length]
            }
          >
            <CoverImage
              src={card.image.src}
              alt={card.image.alt}
              className="absolute inset-0 size-full transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
              <h3 className="font-display text-xl leading-tight sm:text-2xl">{card.title}</h3>
              {total > 0 && (
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-xs tabular-nums backdrop-blur-md">
                  {done}/{total}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
