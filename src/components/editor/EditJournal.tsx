"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useJournal } from "@/context/JournalProvider";
import { boardToJournal, journalToBoard } from "@/lib/board";
import { journalDraftKey } from "@/lib/drafts";
import BoardEditor from "./BoardEditor";

/** Auth guard + loading state around the editor, in journal mode. */
export default function EditJournal() {
  const { user, loading: authLoading } = useAuth();
  const { journal, source, loading, save } = useJournal();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin?next=/journal/edit");
  }, [authLoading, user, router]);

  if (loading || !user) {
    return (
      <>
        <SiteHeader />
        <main aria-busy="true" className="mx-auto max-w-3xl animate-pulse px-4 py-14 sm:px-6">
          <div className="h-12 w-2/3 rounded-2xl bg-surface-muted" />
          <div className="mt-10 h-96 rounded-3xl bg-surface-muted" />
        </main>
      </>
    );
  }

  return (
    <BoardEditor
      key={user.uid}
      kind="journal"
      initial={journalToBoard(journal)}
      isStarter={source === "starter"}
      storageKey={journalDraftKey(user.uid)}
      onSave={(board) => save(boardToJournal(board))}
    />
  );
}
