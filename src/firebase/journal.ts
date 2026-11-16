import { onValue, ref, set } from "firebase/database";
import { normalizeJournal } from "@/lib/board";
import type { Journal } from "@/lib/types";
import { firebaseDb } from "./config";

const journalRef = (uid: string) => ref(firebaseDb(), `users/${uid}/journal`);

export function subscribeToJournal(
  uid: string,
  onData: (journal: Journal | null) => void,
  onError: (err: Error) => void,
) {
  return onValue(journalRef(uid), (snap) => onData(normalizeJournal(snap.val())), onError);
}

export function saveJournal(uid: string, journal: Journal) {
  return set(journalRef(uid), normalizeJournal(journal));
}
