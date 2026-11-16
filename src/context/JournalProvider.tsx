"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { saveJournal, subscribeToJournal } from "@/firebase/journal";
import { boardToJournal, journalToBoard, toggleChecklistItem } from "@/lib/board";
import { sampleJournal } from "@/lib/sample-journal";
import type { Journal } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import type { BoardSource } from "./BoardProvider";
import { useToast } from "./ToastProvider";

interface JournalState {
  journal: Journal;
  /** Same meaning as for the board: sample (signed out), starter (nothing saved yet), saved. */
  source: BoardSource;
  loading: boolean;
  toggleCheck: (entryIndex: number, itemIndex: number) => void;
  save: (journal: Journal) => Promise<void>;
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
  const source: BoardSource = !uid ? "sample" : remoteForUser?.journal ? "saved" : "starter";
  const journal =
    source === "saved"
      ? remoteForUser!.journal!
      : local && local.uid === uid
        ? local.journal
        : sampleJournal;

  const toggleCheck = useCallback(
    (entryIndex: number, itemIndex: number) => {
      const next = boardToJournal(toggleChecklistItem(journalToBoard(journal), entryIndex, itemIndex));
      if (source === "saved" && uid) {
        saveJournal(uid, next).catch(() => toast("Couldn't save that change.", "error"));
      } else {
        setLocal({ uid, journal: next });
      }
    },
    [journal, source, uid, toast],
  );

  const save = useCallback(
    async (next: Journal) => {
      if (!uid) throw new Error("Sign in to save your journal.");
      await saveJournal(uid, next);
    },
    [uid],
  );

  return (
    <JournalContext.Provider value={{ journal, source, loading, toggleCheck, save }}>{children}</JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}
