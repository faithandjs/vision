"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuCheck, LuHistory, LuList, LuListChecks, LuLoaderCircle, LuTrash2 } from "react-icons/lu";
import CoverImage from "@/components/CoverImage";
import {
  cardToDraft,
  draftToRawCard,
  Field,
  ItemsEditor,
  type DraftCard,
} from "@/components/editor/BoardEditor";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useJournal } from "@/context/JournalProvider";
import { useToast } from "@/context/ToastProvider";
import { readStored, writeStored } from "@/hooks/usePersistentState";
import { isHttpUrl, isIsoDate, newEntryId, normalizeEntry, todayIso } from "@/lib/board";
import { entryDraftKey, formatDraftTime, parseEntryDraft, serializeEntryDraft } from "@/lib/drafts";
import type { JournalEntry } from "@/lib/types";

/** Route wrapper: auth guard, loading, and finding the entry. `entryId` null = new entry. */
export default function EditJournalEntry({ entryId }: { entryId: string | null }) {
  const { user, loading: authLoading } = useAuth();
  const { journal, source, loading } = useJournal();
  const router = useRouter();
  const here = entryId ? `/journal/${encodeURIComponent(entryId)}/edit` : "/journal/new";

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/signin?next=${encodeURIComponent(here)}`);
  }, [authLoading, user, router, here]);

  if (loading || !user) {
    return (
      <>
        <SiteHeader />
        <main aria-busy="true" className="mx-auto max-w-3xl animate-pulse px-4 py-14 sm:px-6">
          <div className="h-12 w-2/3 rounded-2xl bg-surface-muted" />
          <div className="mt-10 h-[32rem] rounded-3xl bg-surface-muted" />
        </main>
      </>
    );
  }

  const existing = entryId ? journal.entries.find((e) => e.id === entryId) : null;
  if (entryId && !existing) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-4xl">Entry not found</h1>
          <p className="mt-2 text-muted">It may have been deleted.</p>
          <Link href="/journal" className="btn-primary mt-6">
            Back to journal
          </Link>
        </main>
      </>
    );
  }

  return (
    <EntryForm
      key={`${user.uid}:${entryId ?? "new"}`}
      uid={user.uid}
      initial={existing ?? null}
      // Only entries actually in the database can be deleted (not the examples).
      canDelete={!!existing && source === "saved"}
    />
  );
}

interface FormState {
  id: string;
  date: string;
  card: DraftCard;
}

function toForm(entry: JournalEntry): FormState {
  return { id: entry.id, date: entry.date, card: cardToDraft(entry) };
}

function fromForm(f: FormState): JournalEntry {
  return normalizeEntry({ ...draftToRawCard(f.card), id: f.id, date: f.date }, f.id)!;
}

function validate(f: FormState) {
  const e: { title?: string; src?: string; date?: string } = {};
  if (!f.card.title.trim()) e.title = "Give this entry a title.";
  if (f.card.src.trim() && !isHttpUrl(f.card.src)) e.src = "Use a full link that starts with https://";
  if (!isIsoDate(f.date)) e.date = "Pick a date.";
  return Object.keys(e).length ? e : null;
}

function EntryForm({ uid, initial, canDelete }: { uid: string; initial: JournalEntry | null; canDelete: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { saveEntry, deleteEntry } = useJournal();
  const isNew = initial === null;
  const key = entryDraftKey(uid, initial?.id ?? "new");

  // The starting point: the saved entry, or a blank one dated today.
  const [base] = useState<JournalEntry>(
    () => initial ?? { id: newEntryId(), date: todayIso(), title: "", image: { src: "", alt: "" } },
  );
  const [baseJson] = useState(() => JSON.stringify(normalizeEntry(base, base.id)));
  // Pick up an unsaved draft of this entry, if there is one. (Browser-only: rendered after auth.)
  const [restored, setRestored] = useState(() => parseEntryDraft(readStored(key)));
  const [form, setForm] = useState<FormState>(() => toForm(restored?.entry ?? base));
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const formJson = useMemo(() => JSON.stringify(fromForm(form)), [form]);
  const dirty = formJson !== baseJson;
  const errors = attempted ? validate(form) : null;

  // Keep a draft in this browser as you type; editing back to the saved entry removes it.
  useEffect(() => {
    if (busy) return;
    const stored = readStored(key);
    if (!dirty) {
      if (stored !== null) writeStored(key, null);
      return;
    }
    const current = parseEntryDraft(stored);
    if (!current || JSON.stringify(current.entry) !== formJson) writeStored(key, serializeEntryDraft(JSON.parse(formJson)));
  }, [key, formJson, dirty, busy]);

  const setCard = (patch: Partial<DraftCard>) => setForm((f) => ({ ...f, card: { ...f.card, ...patch } }));

  const discardDraft = () => {
    if (!window.confirm("Discard your draft of this entry?")) return;
    writeStored(key, null);
    setForm(toForm(base));
    setRestored(null);
    setAttempted(false);
    toast("Draft discarded.");
  };

  async function handleSave() {
    setAttempted(true);
    if (validate(form)) {
      toast("Fix the highlighted fields before saving.", "error");
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy("save");
    try {
      await saveEntry(fromForm(form));
      writeStored(key, null);
      toast(isNew ? "Entry added." : "Entry saved.");
      router.push("/journal");
    } catch (err) {
      console.error(err);
      toast("Couldn't save this entry. Try again.", "error");
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!initial || !window.confirm(`Delete “${initial.title}”? This can't be undone.`)) return;
    setBusy("delete");
    try {
      await deleteEntry(initial.id);
      writeStored(key, null);
      toast("Entry deleted.");
      router.push("/journal");
    } catch (err) {
      console.error(err);
      toast("Couldn't delete this entry. Try again.", "error");
      setBusy(null);
    }
  }

  const c = form.card;
  const base_ = `entry-${form.id}`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-40 sm:px-6">
        <div className="animate-rise py-10 sm:py-14">
          <Link href="/journal" className="btn-ghost -ml-3 text-muted">
            <LuArrowLeft size={15} /> Back to journal
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-5xl tracking-tight sm:text-6xl">{isNew ? "New entry" : "Edit entry"}</h1>
            {canDelete && (
              <button onClick={handleDelete} disabled={busy !== null} className="btn-ghost text-danger">
                {busy === "delete" ? <LuLoaderCircle size={15} className="animate-spin" /> : <LuTrash2 size={15} />}
                Delete entry
              </button>
            )}
          </div>
        </div>

        {restored && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-accent/60 bg-accent/15 p-4 sm:flex-row sm:items-center">
            <LuHistory size={18} className="shrink-0 text-accent-deep" />
            <p className="flex-1 text-sm">
              Picked up your draft from {formatDraftTime(restored.savedAt)}. It isn&apos;t saved until you save.
            </p>
            <button onClick={discardDraft} className="btn-outline">
              Discard draft
            </button>
          </div>
        )}

        <article className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_12rem] sm:p-7">
            <Field label="Title" htmlFor={`${base_}-title`} error={errors?.title}>
              <input
                id={`${base_}-title`}
                value={c.title}
                onChange={(e) => setCard({ title: e.target.value })}
                placeholder="Five-year plan"
                aria-invalid={!!errors?.title}
                autoFocus={isNew && !restored}
                className="input font-display !text-2xl"
              />
            </Field>
            <Field label="Date" htmlFor={`${base_}-date`} error={errors?.date}>
              <input
                id={`${base_}-date`}
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                aria-invalid={!!errors?.date}
                className="input py-3"
              />
            </Field>
          </div>

          <div className="grid gap-6 border-t border-line p-5 sm:grid-cols-[10rem_1fr] sm:p-7">
            <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-2xl bg-surface-muted sm:w-full">
              <CoverImage
                src={isHttpUrl(c.src) ? c.src : ""}
                alt={c.alt || "Image preview"}
                className="absolute inset-0 size-full"
              />
            </div>
            <div className="space-y-4">
              <Field
                label="Image link (optional)"
                htmlFor={`${base_}-src`}
                error={errors?.src}
                hint="Paste a link to any image, or leave it blank for a paper note."
              >
                <input
                  id={`${base_}-src`}
                  type="url"
                  inputMode="url"
                  value={c.src}
                  onChange={(e) => setCard({ src: e.target.value })}
                  placeholder="https://…"
                  aria-invalid={!!errors?.src}
                  className="input"
                />
              </Field>
              <Field label="Image description" htmlFor={`${base_}-alt`} hint="Describes the image for screen readers.">
                <input
                  id={`${base_}-alt`}
                  value={c.alt}
                  onChange={(e) => setCard({ alt: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Note" htmlFor={`${base_}-p`}>
                <textarea
                  id={`${base_}-p`}
                  rows={4}
                  value={c.p}
                  onChange={(e) => setCard({ p: e.target.value })}
                  placeholder="Where I want to be, and why it matters…"
                  className="input resize-y"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
            <div className="bg-surface p-5 sm:p-7">
              <ItemsEditor
                heading="Checklist"
                Icon={LuListChecks}
                idBase={`${base_}-check`}
                checkable
                title={c.checkTitle}
                onTitle={(checkTitle) => setCard({ checkTitle })}
                items={c.check}
                onItems={(check) => setCard({ check })}
              />
            </div>
            <div className="bg-surface p-5 sm:p-7">
              <ItemsEditor
                heading="Bullet list"
                Icon={LuList}
                idBase={`${base_}-list`}
                title={c.listTitle}
                onTitle={(listTitle) => setCard({ listTitle })}
                items={c.list}
                onItems={(list) => setCard({ list })}
              />
            </div>
          </div>
        </article>
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
          <Link href="/journal" className="btn-ghost">
            {dirty ? "Save as draft" : "Close"}
          </Link>
          <button onClick={handleSave} disabled={busy !== null || !dirty} className="btn-accent px-6">
            {busy === "save" && <LuLoaderCircle size={16} className="animate-spin" />}
            {isNew ? "Add entry" : "Save entry"}
          </button>
        </div>
      </div>
    </>
  );
}
