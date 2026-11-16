"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuArrowRight, LuCalendar, LuList, LuListChecks, LuPlus } from "react-icons/lu";
import { DraftNotice, SourceNotice } from "@/components/board/BoardParts";
import ViewSwitcher from "@/components/board/ViewSwitcher";
import CoverImage from "@/components/CoverImage";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useJournal } from "@/context/JournalProvider";
import { useStored } from "@/hooks/usePersistentState";
import { cardProgress, formatEntryDate } from "@/lib/board";
import { entryDraftKey, parseEntryDraft } from "@/lib/drafts";
import type { JournalEntry, ViewMode } from "@/lib/types";
import { setPendingView } from "@/lib/view-nav";
import NoteDialog from "./NoteDialog";

export default function JournalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { journal, source, loading, toggleCheck } = useJournal();
  // An unsaved *new* entry is surfaced here; drafts of existing entries restore when you open them.
  const hasNewDraft = parseEntryDraft(useStored(user ? entryDraftKey(user.uid, "new") : "vb-entry-draft:none")) !== null;

  const changeView = (v: ViewMode) => {
    if (v === "journal") return;
    setPendingView(v);
    router.push("/");
  };

  const entries = journal.entries;
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <SiteHeader>
        <ViewSwitcher value="journal" onChange={changeView} />
      </SiteHeader>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        {loading ? (
          <JournalSkeleton />
        ) : (
          <>
            <section className="animate-rise py-12 text-center sm:py-16">
              <p className="eyebrow">Journal</p>
              <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl">
                The longer view
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
                Five-year plans, career moves, the things that take more than a year.
              </p>
              <Link href="/journal/new" className="btn-primary mt-6">
                <LuPlus size={15} /> New entry
              </Link>
            </section>

            {hasNewDraft ? (
              <DraftNotice href="/journal/new" text="You have an unsaved entry." />
            ) : (
              <SourceNotice source={source} kind="journal" />
            )}

            {entries.length === 0 ? (
              <div className="animate-rise mx-auto max-w-md rounded-3xl border-2 border-dashed border-line px-6 py-16 text-center">
                <h2 className="font-display text-3xl">Your journal is empty</h2>
                <p className="mt-2 text-muted">Start with a five-year plan, or wherever your thinking is.</p>
                <Link href="/journal/new" className="btn-primary mt-6">
                  <LuPlus size={15} /> Write your first entry
                </Link>
              </div>
            ) : (
              <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry, i) => (
                  <li key={entry.id}>
                    <NoteCard entry={entry} index={i} onOpen={() => setOpenId(entry.id)} />
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </main>

      <NoteDialog
        entry={openId !== null ? (entries.find((e) => e.id === openId) ?? null) : null}
        onClose={() => setOpenId(null)}
        onToggle={toggleCheck}
      />
    </>
  );
}

/** Compact entry; opens as a note. Entries without an image look like a taped-down paper note. */
function NoteCard({ entry, index, onOpen }: { entry: JournalEntry; index: number; onOpen: () => void }) {
  const hasImage = !!entry.image.src;
  const { done, total } = cardProgress(entry);
  const listCount = entry.list?.list.length ?? 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${entry.title}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={
        "group animate-rise relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 " +
        (hasImage ? "bg-surface" : "bg-accent/12")
      }
    >
      {hasImage ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <CoverImage
            src={entry.image.src}
            alt={entry.image.alt}
            className="absolute inset-0 size-full transition duration-700 group-hover:scale-105"
          />
        </div>
      ) : (
        <span aria-hidden className="absolute top-0 left-1/2 h-5 w-20 -translate-x-1/2 -rotate-3 bg-accent/45" />
      )}
      <div className={"flex flex-1 flex-col p-6 " + (hasImage ? "" : "pt-10")}>
        {entry.date ? (
          <p className="eyebrow flex items-center gap-1.5">
            <LuCalendar size={12} />
            <time dateTime={entry.date}>{formatEntryDate(entry.date)}</time>
          </p>
        ) : (
          <p className="eyebrow">Undated</p>
        )}
        <h3 className="mt-2 font-display text-3xl leading-tight text-balance">{entry.title}</h3>
        {entry.p && (
          <p
            className={
              "mt-3 text-muted " + (hasImage ? "line-clamp-2 text-sm" : "line-clamp-5 font-display text-xl italic")
            }
          >
            {entry.p}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-5 text-xs text-muted">
          {total > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <LuListChecks size={13} /> {done}/{total}
            </span>
          )}
          {listCount > 0 && (
            <span className="flex items-center gap-1">
              <LuList size={13} /> {listCount}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 font-medium text-accent-deep opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Open <LuArrowRight size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}

function JournalSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your journal" className="animate-pulse">
      <div className="flex flex-col items-center py-12 sm:py-16">
        <div className="h-3 w-20 rounded-full bg-surface-muted" />
        <div className="mt-6 h-14 w-full max-w-md rounded-2xl bg-surface-muted sm:h-20" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 rounded-3xl bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
