import { onValue, ref, remove, update } from "firebase/database";
import { normalizeEntry, normalizeJournal } from "@/lib/board";
import type { Journal, JournalEntry } from "@/lib/types";
import { firebaseDb } from "./config";

const journalRef = (uid: string) => ref(firebaseDb(), `users/${uid}/journal`);
const entryRef = (uid: string, id: string) => ref(firebaseDb(), `users/${uid}/journal/entries/${id}`);

export function subscribeToJournal(
  uid: string,
  onData: (journal: Journal | null) => void,
  onError: (err: Error) => void,
) {
  return onValue(journalRef(uid), (snap) => onData(normalizeJournal(snap.val())), onError);
}

/** Writes one entry; the rest of the journal is untouched. */
export function saveJournalEntry(uid: string, entry: JournalEntry) {
  const clean = normalizeEntry(entry, entry.id)!;
  return update(journalRef(uid), { [`entries/${clean.id}`]: clean, started: true });
}

export function deleteJournalEntry(uid: string, id: string) {
  return remove(entryRef(uid, id));
}
