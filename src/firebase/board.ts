import { onValue, ref, set } from "firebase/database";
import { normalizeBoard } from "@/lib/board";
import type { Board } from "@/lib/types";
import { firebaseDb } from "./config";

const boardRef = (uid: string) => ref(firebaseDb(), `users/${uid}`);

/** Live subscription to a user's board. Returns the unsubscribe function. */
export function subscribeToBoard(
  uid: string,
  onData: (board: Board | null) => void,
  onError: (err: Error) => void,
) {
  return onValue(boardRef(uid), (snap) => onData(normalizeBoard(snap.val())), onError);
}

export function saveBoard(uid: string, board: Board) {
  return set(boardRef(uid), normalizeBoard(board));
}
