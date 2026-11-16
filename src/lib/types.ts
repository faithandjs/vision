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

export type ViewMode = "collage" | "cards";
