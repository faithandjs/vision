import type { Board, BoardCard, ChecklistItem, Journal, JournalEntry } from "./types";

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// The Realtime Database returns arrays as arrays-with-holes or as objects with
// numeric keys, depending on what was written. Accept both.
function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v.filter((x) => x != null);
  if (v && typeof v === "object") return Object.values(v).filter((x) => x != null);
  return [];
}

export function normalizeCard(raw: unknown): BoardCard | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const image = (r.image ?? {}) as Record<string, unknown>;

  const card: BoardCard = {
    title: str(r.title),
    image: { src: str(image.src), alt: str(image.alt) },
  };

  const p = str(r.p);
  if (p) card.p = p;

  if (r.list && typeof r.list === "object") {
    const l = r.list as Record<string, unknown>;
    const items = arr(l.list).map(str).filter(Boolean);
    if (items.length) {
      card.list = { list: items };
      if (str(l.title)) card.list.title = str(l.title);
    }
  }

  if (r.check && typeof r.check === "object") {
    const c = r.check as Record<string, unknown>;
    const items: ChecklistItem[] = arr(c.list)
      .map((i) => {
        const item = (i ?? {}) as Record<string, unknown>;
        return { value: str(item.value), checked: item.checked === true };
      })
      .filter((i) => i.value);
    if (items.length) {
      card.check = { list: items };
      if (str(c.title)) card.check.title = str(c.title);
    }
  }

  return card;
}

/**
 * Turns untrusted data (from the database or the editor) into a clean Board.
 * Never produces `undefined` values, which Firebase `set()` rejects.
 */
export function normalizeBoard(raw: unknown): Board | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    title: str(r.title),
    theme: str(r.theme),
    data: arr(r.data)
      .map(normalizeCard)
      .filter((c): c is BoardCard => c !== null),
  };
}

export function cardProgress(card: BoardCard) {
  const items = card.check?.list ?? [];
  return { done: items.filter((i) => i.checked).length, total: items.length };
}

export function boardProgress(board: Board) {
  return board.data.reduce(
    (acc, card) => {
      const { done, total } = cardProgress(card);
      return { done: acc.done + done, total: acc.total + total };
    },
    { done: 0, total: 0 },
  );
}

export function toggleChecklistItem(board: Board, cardIndex: number, itemIndex: number): Board {
  return {
    ...board,
    data: board.data.map((card, ci) => {
      if (ci !== cardIndex || !card.check) return card;
      return {
        ...card,
        check: {
          ...card.check,
          list: card.check.list.map((item, ii) =>
            ii === itemIndex ? { ...item, checked: !item.checked } : item,
          ),
        },
      };
    }),
  };
}

export const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

export const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** A journal entry from untrusted data. `key` is its database key, used as the id. */
export function normalizeEntry(raw: unknown, key: string): JournalEntry | null {
  const card = normalizeCard(raw);
  if (!card) return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" && r.id ? r.id : key;
  return { ...card, id, date: isIsoDate(r.date) ? r.date : "" };
}

/** Newest first; undated entries last. */
export const sortEntries = (entries: JournalEntry[]) =>
  [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.id.localeCompare(b.id));

/**
 * Entries are stored keyed by id (users/{uid}/journal/entries/{id}). Older saves
 * stored an array, whose indices ("0", "1"…) simply become the ids.
 */
export function normalizeJournal(raw: unknown): Journal | null {
  if (!raw || typeof raw !== "object") return null;
  const entriesRaw = (raw as Record<string, unknown>).entries;
  const pairs: [string, unknown][] = Array.isArray(entriesRaw)
    ? entriesRaw.map((v, i) => [String(i), v])
    : entriesRaw && typeof entriesRaw === "object"
      ? Object.entries(entriesRaw)
      : [];
  const entries = pairs
    .map(([key, v]) => normalizeEntry(v, key))
    .filter((e): e is JournalEntry => e !== null);
  // "started" survives deleting every entry, so an emptied journal stays empty
  // instead of falling back to the examples.
  if (!entries.length && (raw as Record<string, unknown>).started !== true) return null;
  return { entries: sortEntries(entries) };
}

export function toggleEntryChecklistItem(entry: JournalEntry, itemIndex: number): JournalEntry {
  if (!entry.check) return entry;
  return {
    ...entry,
    check: {
      ...entry.check,
      list: entry.check.list.map((item, i) => (i === itemIndex ? { ...item, checked: !item.checked } : item)),
    },
  };
}

/** Local date as yyyy-mm-dd. */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "16 Nov 2026". Fixed format (not locale-based) so server and client render the same. */
export function formatEntryDate(iso: string) {
  if (!isIsoDate(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const newEntryId = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
