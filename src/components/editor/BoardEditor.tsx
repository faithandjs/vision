"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowDown,
  LuArrowLeft,
  LuArrowUp,
  LuCheck,
  LuHistory,
  LuList,
  LuListChecks,
  LuLoaderCircle,
  LuPlus,
  LuSparkles,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import CoverImage from "@/components/CoverImage";
import SiteHeader from "@/components/SiteHeader";
import { useToast } from "@/context/ToastProvider";
import { isHttpUrl, normalizeBoard } from "@/lib/board";
import { formatDraftTime, parseDraft, serializeDraft } from "@/lib/drafts";
import { readStored, writeStored } from "@/hooks/usePersistentState";
import type { Board } from "@/lib/types";

// Editor-only shape: every card and line gets a stable id so React keys and
// focus survive reordering and deleting.
interface DraftItem {
  id: string;
  value: string;
  checked: boolean;
}
interface DraftCard {
  id: string;
  title: string;
  src: string;
  alt: string;
  p: string;
  listTitle: string;
  list: DraftItem[];
  checkTitle: string;
  check: DraftItem[];
}
interface Draft {
  title: string;
  theme: string;
  cards: DraftCard[];
}
interface Errors {
  title?: string;
  cards: Record<string, { title?: string; src?: string }>;
}

// Random (not sequential) so ids never collide with ones from a restored draft.
const newId = () => `k${Math.random().toString(36).slice(2, 10)}`;
const item = (value = "", checked = false): DraftItem => ({ id: newId(), value, checked });
const blankCard = (): DraftCard => ({
  id: newId(),
  title: "",
  src: "",
  alt: "",
  p: "",
  listTitle: "",
  list: [],
  checkTitle: "",
  check: [],
});

function toDraft(board: Board): Draft {
  return {
    title: board.title,
    theme: board.theme,
    cards: board.data.map((c) => ({
      id: newId(),
      title: c.title,
      src: c.image.src,
      alt: c.image.alt,
      p: c.p ?? "",
      listTitle: c.list?.title ?? "",
      list: (c.list?.list ?? []).map((v) => item(v)),
      checkTitle: c.check?.title ?? "",
      check: (c.check?.list ?? []).map((i) => item(i.value, i.checked)),
    })),
  };
}

function fromDraft(d: Draft): Board {
  return normalizeBoard({
    title: d.title,
    theme: d.theme,
    data: d.cards.map((c) => ({
      title: c.title,
      image: { src: c.src, alt: c.alt },
      p: c.p,
      list: { title: c.listTitle, list: c.list.map((i) => i.value) },
      check: { title: c.checkTitle, list: c.check.map((i) => ({ value: i.value, checked: i.checked })) },
    })),
  })!;
}

export type EditorKind = "board" | "journal";

const COPY = {
  board: {
    heading: "Edit your board",
    intro: "Give your year a name, then add a card for each thing you\u2019re working toward.",
    home: "/",
    back: "Back to board",
    noun: "card",
    nouns: "cards",
    section: "Cards",
    add: "Add a card",
    titlePlaceholder: "Move every day",
    starter: "We\u2019ve filled this in with an example board. Change anything you like, or start from scratch.",
    saveLabel: "Save board",
    saved: "Board saved.",
    saveError: "Couldn\u2019t save your board. Try again.",
  },
  journal: {
    heading: "Edit your journal",
    intro: "Write down the longer view: your five-year plan, career plan, what you want to learn.",
    home: "/journal",
    back: "Back to journal",
    noun: "entry",
    nouns: "entries",
    section: "Entries",
    add: "Add an entry",
    titlePlaceholder: "Five-year plan",
    starter: "We\u2019ve filled this in with an example journal. Change anything you like, or start from scratch.",
    saveLabel: "Save journal",
    saved: "Journal saved.",
    saveError: "Couldn\u2019t save your journal. Try again.",
  },
} as const;

function validate(d: Draft, kind: EditorKind): Errors | null {
  const cards: Errors["cards"] = {};
  for (const c of d.cards) {
    const e: { title?: string; src?: string } = {};
    if (!c.title.trim()) e.title = `Give this ${COPY[kind].noun} a title.`;
    // The board needs images for the collage; journal entries may skip them.
    if (!c.src.trim()) {
      if (kind === "board") e.src = "Add a link to an image.";
    } else if (!isHttpUrl(c.src)) e.src = "Use a full link that starts with https://";
    if (e.title || e.src) cards[c.id] = e;
  }
  const title = kind === "journal" || d.title.trim() ? undefined : "Give your board a title.";
  return title || Object.keys(cards).length ? { title, cards } : null;
}

/** Editor for the board, or (kind="journal") for journal entries. */
export default function BoardEditor({
  kind = "board",
  initial,
  isStarter,
  storageKey: key,
  onSave,
}: {
  kind?: EditorKind;
  initial: Board;
  isStarter: boolean;
  /** localStorage key for this editor's draft. */
  storageKey: string;
  onSave: (board: Board) => Promise<void>;
}) {
  const copy = COPY[kind];
  const router = useRouter();
  const toast = useToast();
  // Pick up an unsaved draft from a previous visit, if there is one.
  // (This component only renders in the browser, after auth has loaded.)
  const [restored, setRestored] = useState(() => parseDraft(readStored(key)));
  const [draft, setDraft] = useState(() => toDraft(restored?.board ?? initial));
  const [initialJson] = useState(() => JSON.stringify(normalizeBoard(initial)));
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const focusId = useRef<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(fromDraft(draft)) !== initialJson, [draft, initialJson]);
  // Errors only show after the first save attempt, then update live as you fix them.
  const errors = attempted ? validate(draft, kind) : null;
  const canSave = !saving && (dirty || isStarter);

  // Keep the draft in this browser as you type, so any way of leaving keeps it.
  // Editing back to exactly the saved board removes the draft.
  const draftJson = useMemo(() => JSON.stringify(fromDraft(draft)), [draft]);
  useEffect(() => {
    if (saving) return;
    const stored = readStored(key);
    if (!dirty) {
      if (stored !== null) writeStored(key, null);
      return;
    }
    // Only rewrite (and re-timestamp) when the content actually changed.
    const current = parseDraft(stored);
    if (!current || JSON.stringify(current.board) !== draftJson) {
      writeStored(key, serializeDraft(JSON.parse(draftJson)));
    }
  }, [key, draftJson, dirty, saving]);

  const discardDraft = () => {
    if (!window.confirm("Discard your draft? Your saved board stays as it is.")) return;
    writeStored(key, null);
    setDraft(toDraft(initial));
    setRestored(null);
    setAttempted(false);
    toast("Draft discarded.");
  };

  // Focus a newly added card's title field once it has rendered.
  useEffect(() => {
    if (!focusId.current) return;
    const el = document.getElementById(focusId.current);
    focusId.current = null;
    el?.focus({ preventScroll: true });
    el?.closest("article")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const updateCard = (id: string, patch: Partial<DraftCard>) =>
    setDraft((d) => ({ ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const moveCard = (id: string, dir: -1 | 1) =>
    setDraft((d) => {
      const cards = [...d.cards];
      const i = cards.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cards.length) return d;
      [cards[i], cards[j]] = [cards[j], cards[i]];
      return { ...d, cards };
    });

  const removeCard = (id: string) => setDraft((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== id) }));

  const addCard = () => {
    const card = blankCard();
    focusId.current = `card-${card.id}-title`;
    setDraft((d) => ({ ...d, cards: [...d.cards, card] }));
  };

  const startBlank = () => {
    const card = blankCard();
    focusId.current = kind === "board" ? "board-title" : `card-${card.id}-title`;
    setDraft({ title: "", theme: "", cards: [card] });
    setAttempted(false);
  };

  async function handleSave() {
    setAttempted(true);
    if (validate(draft, kind)) {
      toast("Fix the highlighted fields before saving.", "error");
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSave(fromDraft(draft));
      writeStored(key, null);
      toast(copy.saved);
      router.push(copy.home);
    } catch (err) {
      console.error(err);
      toast(copy.saveError, "error");
      setSaving(false);
    }
  }

  const count = draft.cards.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-40 sm:px-6">
        <div className="animate-rise py-10 sm:py-14">
          <Link href={copy.home} className="btn-ghost -ml-3 text-muted">
            <LuArrowLeft size={15} /> {copy.back}
          </Link>
          <h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">{copy.heading}</h1>
          <p className="mt-2 text-muted">{copy.intro}</p>
        </div>

        {restored && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-accent/60 bg-accent/15 p-4 sm:flex-row sm:items-center">
            <LuHistory size={18} className="shrink-0 text-accent-deep" />
            <p className="flex-1 text-sm">
              Picked up your draft from {formatDraftTime(restored.savedAt)}. It isn&apos;t on your board until you
              save.
            </p>
            <button onClick={discardDraft} className="btn-outline">
              Discard draft
            </button>
          </div>
        )}

        {isStarter && !restored && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <LuSparkles size={18} className="shrink-0 text-accent-deep" />
            <p className="flex-1 text-sm">
              {copy.starter}
            </p>
            <button onClick={startBlank} className="btn-outline">
              Start blank
            </button>
          </div>
        )}

        {kind === "board" && (
        <section className="space-y-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <Field label="Board title" htmlFor="board-title" error={errors?.title}>
            <input
              id="board-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="The Year of Becoming"
              aria-invalid={!!errors?.title}
              className="input font-display !text-2xl"
            />
          </Field>
          <Field label="Theme or mantra" htmlFor="board-theme" hint="One line that sums up the year.">
            <input
              id="board-theme"
              value={draft.theme}
              onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))}
              placeholder="Slower mornings, braver choices."
              className="input"
            />
          </Field>
        </section>
        )}

        <div className={kind === "board" ? "mt-12 mb-4" : "mb-4"}>
          <h2 className="font-display text-3xl">{copy.section}</h2>
          <p className="text-sm text-muted">
            {count} {count === 1 ? copy.noun : copy.nouns}
          </p>
        </div>

        <ol className="space-y-5">
          {draft.cards.map((card, i) => (
            <li key={card.id}>
              <CardEditor
                card={card}
                index={i}
                count={count}
                errors={errors?.cards[card.id]}
                onChange={(patch) => updateCard(card.id, patch)}
                onMove={(dir) => moveCard(card.id, dir)}
                onRemove={() => removeCard(card.id)}
                noun={copy.noun}
                titlePlaceholder={copy.titlePlaceholder}
                imageOptional={kind === "journal"}
              />
            </li>
          ))}
        </ol>

        <button
          onClick={addCard}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line py-8 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-deep"
        >
          <LuPlus size={16} /> {copy.add}
        </button>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <p className="flex flex-1 items-center gap-1.5 text-sm text-muted">
            {dirty ? (
              <>
                <LuCheck size={15} className="text-accent-deep" /> Draft saved
              </>
            ) : (
              "No changes yet"
            )}
          </p>
          {dirty && (
            <button onClick={discardDraft} className="btn-ghost hidden text-muted sm:inline-flex">
              Discard
            </button>
          )}
          <Link href={copy.home} className="btn-ghost">
            {dirty ? "Save as draft" : "Close"}
          </Link>
          <button onClick={handleSave} disabled={!canSave} className="btn-accent px-6">
            {saving && <LuLoaderCircle size={16} className="animate-spin" />}
            {copy.saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function CardEditor({
  card,
  index,
  count,
  errors,
  onChange,
  onMove,
  onRemove,
  noun,
  titlePlaceholder,
  imageOptional,
}: {
  card: DraftCard;
  index: number;
  count: number;
  errors?: { title?: string; src?: string };
  onChange: (patch: Partial<DraftCard>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  noun: string;
  titlePlaceholder: string;
  imageOptional: boolean;
}) {
  const base = `card-${card.id}`;
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line py-2.5 pr-3 pl-5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-muted tabular-nums">
          {index + 1}
        </span>
        <p className="flex-1 truncate text-sm font-medium">{card.title || `Untitled ${noun}`}</p>
        <button className="icon-btn" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${noun} up`}>
          <LuArrowUp size={16} />
        </button>
        <button
          className="icon-btn"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
          aria-label={`Move ${noun} down`}
        >
          <LuArrowDown size={16} />
        </button>
        <button className="icon-btn hover:!text-danger" onClick={onRemove} aria-label={`Remove ${noun}`}>
          <LuTrash2 size={16} />
        </button>
      </header>

      <div className="grid gap-6 p-5 sm:grid-cols-[10rem_1fr] sm:p-6">
        <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-2xl bg-surface-muted sm:w-full">
          <CoverImage
            src={isHttpUrl(card.src) ? card.src : ""}
            alt={card.alt || "Image preview"}
            className="absolute inset-0 size-full"
          />
        </div>
        <div className="space-y-4">
          <Field label="Title" htmlFor={`${base}-title`} error={errors?.title}>
            <input
              id={`${base}-title`}
              value={card.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={titlePlaceholder}
              aria-invalid={!!errors?.title}
              className="input"
            />
          </Field>
          <Field
            label={imageOptional ? "Image link (optional)" : "Image link"}
            htmlFor={`${base}-src`}
            error={errors?.src}
            hint="Paste a link to any image: Pinterest, Unsplash, your own."
          >
            <input
              id={`${base}-src`}
              type="url"
              inputMode="url"
              value={card.src}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://…"
              aria-invalid={!!errors?.src}
              className="input"
            />
          </Field>
          <Field label="Image description" htmlFor={`${base}-alt`} hint="Describes the image for screen readers.">
            <input
              id={`${base}-alt`}
              value={card.alt}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="Runner climbing stone steps"
              className="input"
            />
          </Field>
          <Field label="Note" htmlFor={`${base}-p`}>
            <textarea
              id={`${base}-p`}
              rows={2}
              value={card.p}
              onChange={(e) => onChange({ p: e.target.value })}
              placeholder="Why this matters to me…"
              className="input resize-y"
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
        <div className="bg-surface p-5 sm:p-6">
          <ItemsEditor
            heading="Checklist"
            Icon={LuListChecks}
            idBase={`${base}-check`}
            checkable
            title={card.checkTitle}
            onTitle={(checkTitle) => onChange({ checkTitle })}
            items={card.check}
            onItems={(check) => onChange({ check })}
          />
        </div>
        <div className="bg-surface p-5 sm:p-6">
          <ItemsEditor
            heading="Bullet list"
            Icon={LuList}
            idBase={`${base}-list`}
            title={card.listTitle}
            onTitle={(listTitle) => onChange({ listTitle })}
            items={card.list}
            onItems={(list) => onChange({ list })}
          />
        </div>
      </div>
    </article>
  );
}

function ItemsEditor({
  heading,
  Icon,
  idBase,
  checkable = false,
  title,
  onTitle,
  items,
  onItems,
}: {
  heading: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  idBase: string;
  checkable?: boolean;
  title: string;
  onTitle: (v: string) => void;
  items: DraftItem[];
  onItems: (items: DraftItem[]) => void;
}) {
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  });

  const inputId = (id: string) => `${idBase}-${id}`;
  const update = (id: string, patch: Partial<DraftItem>) =>
    onItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const insertAt = (index: number) => {
    const next = item();
    focusId.current = inputId(next.id);
    onItems([...items.slice(0, index), next, ...items.slice(index)]);
  };

  const remove = (index: number, focusPrevious = false) => {
    if (focusPrevious && index > 0) focusId.current = inputId(items[index - 1].id);
    onItems(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-muted" />
        <h3 className="text-sm font-semibold">{heading}</h3>
      </div>
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Heading (optional)"
        aria-label={`${heading} heading`}
        className="input mb-3 py-2"
      />
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-2">
            {checkable ? (
              <input
                type="checkbox"
                checked={it.checked}
                onChange={(e) => update(it.id, { checked: e.target.checked })}
                aria-label={`Mark "${it.value || "item"}" as done`}
                className="size-4 shrink-0 accent-success"
              />
            ) : (
              <span className="mx-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            )}
            <input
              id={inputId(it.id)}
              value={it.value}
              onChange={(e) => update(it.id, { value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertAt(i + 1);
                } else if (e.key === "Backspace" && it.value === "") {
                  e.preventDefault();
                  remove(i, true);
                }
              }}
              placeholder={checkable ? "Something to do" : "Item"}
              aria-label={`${heading} item ${i + 1}`}
              className="input py-2"
            />
            <button onClick={() => remove(i)} className="icon-btn size-8 shrink-0" aria-label="Remove item">
              <LuX size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => insertAt(items.length)} className="btn-ghost mt-2 -ml-2 text-muted">
        <LuPlus size={14} /> Add item
      </button>
    </div>
  );
}
