import { normalizeBoard } from "./board";
import type { Board } from "./types";

// Unsaved editor work is kept in this browser per account, so leaving the
// editor (Cancel, Back, closing the tab) never loses it.

export const draftKey = (uid: string) => `vb-draft:${uid}`;

export interface StoredDraft {
  savedAt: number;
  board: Board;
}

export const serializeDraft = (board: Board) => JSON.stringify({ savedAt: Date.now(), board });

/** Stored drafts are untrusted (localStorage), so normalize on the way in. */
export function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const board = normalizeBoard(parsed?.board);
    if (!board) return null;
    return { savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(), board };
  } catch {
    return null;
  }
}

export function formatDraftTime(ts: number) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
