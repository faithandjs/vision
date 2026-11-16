"use client";
import { useEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
import CoverImage from "@/components/CoverImage";
import type { BoardCard } from "@/lib/types";
import CardDetails from "./CardDetails";

export default function CardDialog({
  card,
  index,
  onClose,
  onToggle,
}: {
  card: BoardCard | null;
  index: number;
  onClose: () => void;
  onToggle: (cardIndex: number, itemIndex: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (card && !dialog.open) dialog.showModal();
    if (!card && dialog.open) dialog.close();
  }, [card]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border-0 bg-surface p-0 text-ink shadow-2xl ring-1 ring-line md:overflow-hidden"
    >
      {card && (
        <div className="grid md:h-[min(36rem,calc(100dvh-4rem))] md:grid-cols-[1.1fr_1fr]">
          <div className="relative h-60 md:h-auto">
            <CoverImage src={card.image.src} alt={card.image.alt} className="absolute inset-0 size-full" />
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-start gap-3 px-6 pt-6 pb-4 md:px-8 md:pt-8">
              <h2 className="flex-1 font-display text-4xl leading-tight">{card.title}</h2>
              <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
                <LuX size={18} />
              </button>
            </div>
            <div className="px-6 pb-8 md:overflow-y-auto md:px-8">
              <CardDetails card={card} cardIndex={index} onToggle={onToggle} />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
