"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CardDialog from "@/components/board/CardDialog";
import CollageStudio from "@/components/board/CollageStudio";
import FlipCard from "@/components/board/FlipCard";
import ViewSwitcher from "@/components/board/ViewSwitcher";
import { BoardHero, BoardSkeleton, DraftNotice, EmptyBoard, SourceNotice } from "@/components/board/BoardParts";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useBoard } from "@/context/BoardProvider";
import { useStored } from "@/hooks/usePersistentState";
import { draftKey, parseDraft } from "@/lib/drafts";
import type { ViewMode } from "@/lib/types";
import { clearPendingView, peekPendingView } from "@/lib/view-nav";

export default function BoardPage() {
  const { board, source, loading, toggleCheck } = useBoard();
  const { user } = useAuth();
  const hasDraft = parseDraft(useStored(user ? draftKey(user.uid) : "vb-draft:none")) !== null;
  const router = useRouter();
  // Open on Cards, unless the Journal page just sent us to Collage. That hint only
  // exists during client navigation, so a full load always renders Cards (no flip).
  const [view, setView] = useState<Exclude<ViewMode, "journal">>(() =>
    peekPendingView() === "collage" ? "collage" : "cards",
  );
  useEffect(() => clearPendingView(), []);
  const changeView = (v: ViewMode) => (v === "journal" ? router.push("/journal") : setView(v));
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = board.title ? `${board.title} · enVision` : "enVision";
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
        <ViewSwitcher
          value={view}
          onChange={changeView}
          flip={count > 0 ? { allFlipped, onToggle: flipAll } : undefined}
        />
      </SiteHeader>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {loading ? (
          <BoardSkeleton />
        ) : (
          <>
            {/* In collage view the image itself carries the title. */}
            {view === "cards" || count === 0 ? <BoardHero board={board} /> : <div className="h-8" />}
            {hasDraft ? <DraftNotice /> : <SourceNotice source={source} />}
            {count === 0 ? (
              <EmptyBoard />
            ) : view === "collage" ? (
              <CollageStudio board={board} onOpenCard={setOpenIndex} />
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
