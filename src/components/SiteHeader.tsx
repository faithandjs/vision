"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuLogOut, LuNotebookPen, LuPencil, LuSettings } from "react-icons/lu";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import { signOut } from "@/firebase/auth";
import AppearanceSettings from "./AppearanceSettings";
import Avatar from "./Avatar";

export function Logo() {
  return (
    <Link href="/" aria-label="enVision, home" className="font-display text-2xl tracking-tight">
      <span className="text-accent-deep italic">en</span>Vision
      <span className="text-accent">.</span>
    </Link>
  );
}

export default function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
      {/* Three columns so the view bar sits in the true center. */}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-4 sm:gap-2 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Logo />
        </div>
        <div className="justify-self-center">{children}</div>
        <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

const itemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-surface-muted";

function UserMenu() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return <div className="size-9 animate-pulse rounded-full bg-surface-muted" />;

  if (!user) {
    return (
      <Link href="/signin" className="btn-primary">
        Sign in
      </Link>
    );
  }

  const name = user.displayName || user.email || "Your account";

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut();
      toast("You've been signed out.");
      router.push("/");
    } catch {
      toast("Couldn't sign out. Try again.", "error");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full transition hover:brightness-105"
      >
        <span className="icon-btn md:hidden">
          <LuSettings size={18} />
        </span>
        <span className="hidden md:block">
          <Avatar src={user.photoURL} name={name} className="size-9 text-sm" />
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="animate-rise no-scrollbar absolute right-0 mt-2 max-h-[calc(100dvh-5rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/15"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar src={user.photoURL} name={name} className="size-10 shrink-0 text-sm" />
            <div className="min-w-0">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="truncate text-sm font-medium">{name}</p>
              {user.displayName && user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/edit" className={itemClass} onClick={() => setOpen(false)}>
            <LuPencil size={15} className="text-muted" /> Edit board
          </Link>
          <Link role="menuitem" href="/journal/new" className={itemClass} onClick={() => setOpen(false)}>
            <LuNotebookPen size={15} className="text-muted" /> New journal entry
          </Link>
          <div className="my-1 h-px bg-line" />
          <div className="px-3 py-2">
            <AppearanceSettings />
          </div>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={itemClass + " text-danger"} onClick={handleSignOut}>
            <LuLogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
