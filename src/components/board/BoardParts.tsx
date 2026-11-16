"use client";
import Link from "next/link";
import { LuArrowRight, LuPencil, LuSparkles } from "react-icons/lu";
import type { BoardSource } from "@/context/BoardProvider";
import { boardProgress } from "@/lib/board";
import type { Board } from "@/lib/types";
import { ProgressBar } from "./CardDetails";

export function BoardHero({ board }: { board: Board }) {
  const { done, total } = boardProgress(board);
  return (
    <section className="animate-rise py-12 text-center sm:py-20">
      <p className="eyebrow">Vision board</p>
      <h1 className="mx-auto mt-4 max-w-4xl font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl lg:text-8xl">
        {board.title || "My vision board"}
      </h1>
      {board.theme && (
        <p className="mx-auto mt-5 max-w-2xl font-display text-xl text-balance text-muted italic sm:text-2xl">
          {board.theme}
        </p>
      )}
      {total > 0 && (
        <div className="mx-auto mt-8 flex max-w-xs flex-col items-center gap-2">
          <ProgressBar value={done / total} className="w-full" />
          <p className="text-xs text-muted tabular-nums">
            {done} of {total} intentions complete
          </p>
        </div>
      )}
    </section>
  );
}

export function SourceNotice({ source }: { source: BoardSource }) {
  if (source === "saved") return null;
  const [text, cta, href] =
    source === "sample"
      ? ["You're looking at an example board.", "Create your own", "/signup"]
      : ["This example is here to get you started.", "Make it yours", "/edit"];
  return (
    <div className="animate-rise mx-auto mb-10 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl border border-line bg-surface/70 py-1.5 pr-1.5 pl-4 text-sm backdrop-blur sm:rounded-full">
      <LuSparkles size={15} className="shrink-0 text-accent-deep" />
      <span>{text}</span>
      <Link href={href} className="btn-accent py-1.5">
        {cta} <LuArrowRight size={14} />
      </Link>
    </div>
  );
}

export function EmptyBoard() {
  return (
    <div className="animate-rise mx-auto max-w-md rounded-3xl border-2 border-dashed border-line px-6 py-16 text-center">
      <h2 className="font-display text-3xl">Your board is empty</h2>
      <p className="mt-2 text-muted">Add a card for each thing you&apos;re working toward this year.</p>
      <Link href="/edit" className="btn-primary mt-6">
        <LuPencil size={15} /> Add cards
      </Link>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your board" className="animate-pulse">
      <div className="flex flex-col items-center py-12 sm:py-20">
        <div className="h-3 w-24 rounded-full bg-surface-muted" />
        <div className="mt-6 h-14 w-full max-w-xl rounded-2xl bg-surface-muted sm:h-20" />
        <div className="mt-6 h-5 w-full max-w-md rounded-full bg-surface-muted" />
      </div>
      <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
        {["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-[2/3]", "aspect-[5/4]", "aspect-square", "aspect-[3/4]"].map(
          (shape, i) => (
            <div key={i} className={"mb-4 rounded-2xl bg-surface-muted " + shape} />
          ),
        )}
      </div>
    </div>
  );
}
