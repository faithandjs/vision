// Field names (p, list.list, check.list) match the shape already stored in
// the Realtime Database, so existing boards keep loading.

export interface BoardImage {
  src: string;
  alt: string;
}

export interface ChecklistItem {
  value: string;
  checked: boolean;
}

export interface BoardCard {
  title: string;
  image: BoardImage;
  /** Short note / description. */
  p?: string;
  list?: { title?: string; list: string[] };
  check?: { title?: string; list: ChecklistItem[] };
}

export interface Board {
  title: string;
  theme: string;
  data: BoardCard[];
}

/** A journal entry: a card plus a stable id and a date. */
export interface JournalEntry extends BoardCard {
  id: string;
  /** yyyy-mm-dd */
  date: string;
}

/** Longer-range plans (five-year plan, career…), kept apart from the board. Newest first. */
export interface Journal {
  entries: JournalEntry[];
}

export type ViewMode = "cards" | "collage" | "journal";
