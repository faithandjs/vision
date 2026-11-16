"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuLogOut, LuMoon, LuPencil, LuSun } from "react-icons/lu";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { signOut } from "@/firebase/auth";
import Logo from "./Logo";

export default function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {children}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button onClick={toggleTheme} className="icon-btn" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? <LuSun size={18} /> : <LuMoon size={18} />}
    </button>
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
        className="grid size-9 place-items-center overflow-hidden rounded-full bg-accent text-sm font-semibold text-accent-ink transition hover:brightness-105"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="animate-rise absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/15"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-muted">Signed in as</p>
            <p className="truncate text-sm font-medium">{name}</p>
            {user.displayName && user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/edit" className={itemClass} onClick={() => setOpen(false)}>
            <LuPencil size={15} className="text-muted" /> Edit board
          </Link>
          <button role="menuitem" className={itemClass + " text-danger"} onClick={handleSignOut}>
            <LuLogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
