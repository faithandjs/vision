import type { Board, BoardCard, ChecklistItem } from "./types";

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// The Realtime Database returns arrays as arrays-with-holes or as objects with
// numeric keys, depending on what was written. Accept both.
function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v.filter((x) => x != null);
  if (v && typeof v === "object") return Object.values(v).filter((x) => x != null);
  return [];
}

function normalizeCard(raw: unknown): BoardCard | null {
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
