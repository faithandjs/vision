"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { saveBoard, subscribeToBoard } from "@/firebase/board";
import { toggleChecklistItem } from "@/lib/board";
import { sampleBoard } from "@/lib/sample-board";
import type { Board } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

/**
 * - `sample`:  signed out; showing the example board (changes stay local)
 * - `starter`: signed in, but nothing saved yet; showing the example board
 * - `saved`:   the user's own board, synced live from the database
 */
export type BoardSource = "sample" | "starter" | "saved";

interface BoardState {
  board: Board;
  source: BoardSource;
  loading: boolean;
  toggleCheck: (cardIndex: number, itemIndex: number) => void;
  save: (board: Board) => Promise<void>;
}

const BoardContext = createContext<BoardState | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? null;

  // Latest snapshot from the database, tagged with whose it is so a stale
  // value is never shown after switching accounts.
  const [remote, setRemote] = useState<{ uid: string; board: Board | null } | null>(null);
  // Unsaved, local-only board (sample/starter) — also tagged by owner.
  const [local, setLocal] = useState<{ uid: string | null; board: Board } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToBoard(
      uid,
      (board) => setRemote({ uid, board }),
      (err) => {
        console.error(err);
        toast("Couldn't load your board. Check your database rules.", "error");
        setRemote({ uid, board: null });
      },
    );
  }, [uid, toast]);

  const remoteForUser = remote && remote.uid === uid ? remote : null;
  const loading = authLoading || (uid !== null && remoteForUser === null);
  const source: BoardSource = !uid ? "sample" : remoteForUser?.board ? "saved" : "starter";
  const board =
    source === "saved"
      ? remoteForUser!.board!
      : local && local.uid === uid
        ? local.board
        : sampleBoard;

  const toggleCheck = useCallback(
    (cardIndex: number, itemIndex: number) => {
      const next = toggleChecklistItem(board, cardIndex, itemIndex);
      if (source === "saved" && uid) {
        // The database fires a local event immediately, and rolls back if the
        // write is rejected, so no separate optimistic state is needed.
        saveBoard(uid, next).catch(() => toast("Couldn't save that change.", "error"));
      } else {
        setLocal({ uid, board: next });
      }
    },
    [board, source, uid, toast],
  );

  const save = useCallback(
    async (next: Board) => {
      if (!uid) throw new Error("Sign in to save your board.");
      await saveBoard(uid, next);
    },
    [uid],
  );

  return (
    <BoardContext.Provider value={{ board, source, loading, toggleCheck, save }}>{children}</BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used inside BoardProvider");
  return ctx;
}
