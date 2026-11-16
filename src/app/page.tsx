"use client";
import { useEffect, useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import CardDialog from "@/components/board/CardDialog";
import CollageView from "@/components/board/CollageView";
import FlipCard from "@/components/board/FlipCard";
import ViewSwitcher from "@/components/board/ViewSwitcher";
import { BoardHero, BoardSkeleton, EmptyBoard, SourceNotice } from "@/components/board/BoardParts";
import SiteHeader from "@/components/SiteHeader";
import { useBoard } from "@/context/BoardProvider";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { ViewMode } from "@/lib/types";

const VIEWS: readonly ViewMode[] = ["collage", "cards"];

export default function BoardPage() {
  const { board, source, loading, toggleCheck } = useBoard();
  const [view, setView] = usePersistentState<ViewMode>("vb-view", "collage", VIEWS);
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = board.title ? `${board.title} · Vision Board` : "Vision Board";
  }, [board.title]);

  const count = board.data.length;
  const allFlipped = count > 0 && flipped.size === count;
  const flipAll = () => setFlipped(allFlipped ? new Set() : new Set(board.data.map((_, i) => i)));
  const flipOne = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <>
      <SiteHeader>
        {view === "cards" && count > 0 && (
          <button onClick={flipAll} className="btn-ghost" aria-label={allFlipped ? "Show fronts" : "Flip all cards"}>
            <LuRefreshCw size={15} />
            <span className="hidden md:inline">{allFlipped ? "Show fronts" : "Flip all"}</span>
          </button>
        )}
        <ViewSwitcher value={view} onChange={setView} />
      </SiteHeader>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {loading ? (
          <BoardSkeleton />
        ) : (
          <>
            <BoardHero board={board} />
            <SourceNotice source={source} />
            {count === 0 ? (
              <EmptyBoard />
            ) : view === "collage" ? (
              <CollageView cards={board.data} onOpen={setOpenIndex} />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {board.data.map((card, i) => (
                  <FlipCard
                    key={i}
                    card={card}
                    index={i}
                    flipped={flipped.has(i)}
                    onFlip={() => flipOne(i)}
                    onToggle={toggleCheck}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <CardDialog
        card={openIndex !== null ? (board.data[openIndex] ?? null) : null}
        index={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
        onToggle={toggleCheck}
      />
    </>
  );
}
