"use client";
import Link from "next/link";
import { useState } from "react";
import { LuLoaderCircle, LuUserRound } from "react-icons/lu";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import { isHttpUrl } from "@/lib/board";

/** Round avatar: the photo if there is one, else the first letter of the name. */
export function Avatar({ src, name, className = "" }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(src)}
        className={"rounded-full object-cover " + className}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={"grid place-items-center rounded-full bg-accent font-semibold text-accent-ink " + className}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Settings → Profile: shows and edits the signed-in user's name and photo. */
export default function ProfileSection() {
  const { user, loading, configured, updateUserProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.displayName ?? "");
  const [photo, setPhoto] = useState(user?.photoURL ?? "");
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />;

  if (!user) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-line p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-muted">
          <LuUserRound size={22} />
        </span>
        <p className="flex-1 text-sm text-muted">Sign in to add your name and photo.</p>
        {configured && (
          <Link href="/signin" className="btn-primary">
            Sign in
          </Link>
        )}
      </div>
    );
  }

  const shownName = name.trim() || user.email || "You";
  const photoError = photo.trim() && !isHttpUrl(photo) ? "Use a full link that starts with https://" : null;
  const changed = name.trim() !== (user.displayName ?? "") || photo.trim() !== (user.photoURL ?? "");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photoError || !changed) return;
    setSaving(true);
    try {
      await updateUserProfile({ displayName: name.trim() || null, photoURL: photo.trim() || null });
      toast("Profile updated.");
    } catch (err) {
      console.error(err);
      toast("Couldn't update your profile. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-line p-4">
      <div className="flex items-center gap-4">
        {/* Live preview of what you're typing */}
        <Avatar src={isHttpUrl(photo) ? photo.trim() : null} name={shownName} className="size-14 shrink-0 text-xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl leading-tight">{shownName}</p>
          {user.email && <p className="truncate text-sm text-muted">{user.email}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="profile-name" className="label">
          Name
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          maxLength={60}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="profile-photo" className="label">
          Photo link
        </label>
        <input
          id="profile-photo"
          type="url"
          inputMode="url"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder="https://…"
          aria-invalid={!!photoError}
          className="input"
        />
        <p className={"mt-1.5 text-xs " + (photoError ? "text-danger" : "text-muted")}>
          {photoError ?? "Paste a link to a picture, or leave it blank to use your initial."}
        </p>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!changed || !!photoError || saving} className="btn-accent px-5">
          {saving && <LuLoaderCircle size={15} className="animate-spin" />}
          Save profile
        </button>
      </div>
    </form>
  );
}
