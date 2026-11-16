"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { deleteJournalEntry, saveJournalEntry, subscribeToJournal } from "@/firebase/journal";
import { toggleEntryChecklistItem } from "@/lib/board";
import { sampleJournal } from "@/lib/sample-journal";
import type { Journal, JournalEntry } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import type { BoardSource } from "./BoardProvider";
import { useToast } from "./ToastProvider";

interface JournalState {
  journal: Journal;
  /** Same meaning as for the board: sample (signed out), starter (nothing saved yet), saved. */
  source: BoardSource;
  loading: boolean;
  toggleCheck: (entryId: string, itemIndex: number) => void;
  /** Saves one entry (new or existing); other entries are untouched. */
  saveEntry: (entry: JournalEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const JournalContext = createContext<JournalState | null>(null);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? null;

  const [remote, setRemote] = useState<{ uid: string; journal: Journal | null } | null>(null);
  const [local, setLocal] = useState<{ uid: string | null; journal: Journal } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToJournal(
      uid,
      (journal) => setRemote({ uid, journal }),
      (err) => {
        console.error(err);
        toast("Couldn't load your journal. Check your database rules.", "error");
        setRemote({ uid, journal: null });
      },
    );
  }, [uid, toast]);

  const remoteForUser = remote && remote.uid === uid ? remote : null;
  const loading = authLoading || (uid !== null && remoteForUser === null);
  const saved = remoteForUser?.journal ?? null;
  const source: BoardSource = !uid ? "sample" : saved ? "saved" : "starter";
  const journal = saved ?? (local && local.uid === uid ? local.journal : sampleJournal);

  const toggleCheck = useCallback(
    (entryId: string, itemIndex: number) => {
      const entry = journal.entries.find((e) => e.id === entryId);
      if (!entry) return;
      const next = toggleEntryChecklistItem(entry, itemIndex);
      if (source === "saved" && uid) {
        saveJournalEntry(uid, next).catch(() => toast("Couldn't save that change.", "error"));
      } else {
        setLocal({ uid, journal: { entries: journal.entries.map((e) => (e.id === entryId ? next : e)) } });
      }
    },
    [journal, source, uid, toast],
  );

  const saveEntry = useCallback(
    async (entry: JournalEntry) => {
      if (!uid) throw new Error("Sign in to save journal entries.");
      await saveJournalEntry(uid, entry);
    },
    [uid],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!uid) throw new Error("Sign in to delete journal entries.");
      await deleteJournalEntry(uid, id);
    },
    [uid],
  );

  return (
    <JournalContext.Provider value={{ journal, source, loading, toggleCheck, saveEntry, deleteEntry }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}
