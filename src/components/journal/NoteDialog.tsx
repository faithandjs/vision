"use client";
import { useEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
import CardDetails from "@/components/board/CardDetails";
import CoverImage from "@/components/CoverImage";
import type { BoardCard } from "@/lib/types";

/** A journal entry opened as a note: paper card, tape, optional image, full details. */
export default function NoteDialog({
  entry,
  index,
  onClose,
  onToggle,
}: {
  entry: BoardCard | null;
  index: number;
  onClose: () => void;
  onToggle: (entryIndex: number, itemIndex: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (entry && !dialog.open) dialog.showModal();
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="note-title"
      className="no-scrollbar m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border-0 bg-surface p-0 text-ink shadow-2xl ring-1 ring-line"
    >
      {entry && (
        <article className="relative px-6 pt-10 pb-10 sm:px-10">
          {/* A strip of tape holding the note down */}
          <span
            aria-hidden
            className="absolute top-0 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-2 rounded-b-sm bg-accent/45"
          />
          <button onClick={onClose} className="icon-btn absolute top-4 right-4" aria-label="Close note">
            <LuX size={18} />
          </button>

          {entry.image.src && (
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl">
              <CoverImage src={entry.image.src} alt={entry.image.alt} className="absolute inset-0 size-full" />
            </div>
          )}

          <p className="eyebrow">Entry {String(index + 1).padStart(2, "0")}</p>
          <h2 id="note-title" className="mt-2 font-display text-4xl leading-tight text-balance sm:text-5xl">
            {entry.title}
          </h2>
          <div className="mt-6 border-t border-line pt-6">
            <CardDetails card={entry} cardIndex={index} onToggle={onToggle} />
          </div>
        </article>
      )}
    </dialog>
  );
}
