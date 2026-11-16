import { onValue, ref, update } from "firebase/database";
import { normalizeBoard } from "@/lib/board";
import type { Board } from "@/lib/types";
import { firebaseDb } from "./config";

const userRef = (uid: string) => ref(firebaseDb(), `users/${uid}`);

/** Live subscription to a user's board. Returns the unsubscribe function. */
export function subscribeToBoard(
  uid: string,
  onData: (board: Board | null) => void,
  onError: (err: Error) => void,
) {
  return onValue(
    userRef(uid),
    (snap) => {
      const v = snap.val();
      // The node also holds the journal; only treat it as a saved board if board fields exist.
      const hasBoard = v && typeof v === "object" && ("title" in v || "theme" in v || "data" in v);
      onData(hasBoard ? normalizeBoard(v) : null);
    },
    onError,
  );
}

/**
 * Updates only the board's own fields (title, theme, data). `set()` would
 * replace the whole user node and erase the journal stored beside it.
 */
export function saveBoard(uid: string, board: Board) {
  const { title, theme, data } = normalizeBoard(board)!;
  return update(userRef(uid), { title, theme, data });
}
