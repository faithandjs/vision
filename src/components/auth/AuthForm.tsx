"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuCircleAlert, LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";
import CoverImage from "@/components/CoverImage";
import { Logo } from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import { authErrorMessage, signIn, signUp } from "@/firebase/auth";
import { sampleBoard } from "@/lib/sample-board";

// Only allow same-site relative redirects.
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const toast = useToast();
  const { user, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in, or just signed in: move on.
  useEffect(() => {
    if (user) router.replace(nextPath());
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
      toast(isSignup ? "Welcome! Your account is ready." : "Welcome back.");
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="animate-rise mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-5xl leading-none tracking-tight">
            {isSignup ? "Start your board" : "Welcome back"}
          </h1>
          <p className="mt-3 text-muted">
            {isSignup ? "Picture the year you want, then go make it happen." : "Sign in to pick up where you left off."}
          </p>

          {!configured && (
            <div className="mt-6 rounded-2xl border border-line bg-surface-muted p-4 text-sm">
              <p className="font-medium">Firebase isn&apos;t set up yet</p>
              <p className="mt-1 text-muted">
                Copy <code className="font-mono text-xs">.env.example</code> to{" "}
                <code className="font-mono text-xs">.env.local</code>, add your project&apos;s keys, and restart the dev
                server.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input py-3"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "At least 6 characters" : "Your password"}
                  className="input py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="icon-btn absolute top-1/2 right-1.5 -translate-y-1/2"
                >
                  {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
                <LuCircleAlert size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" disabled={!configured || submitting} className="btn-primary w-full py-3">
              {submitting && <LuLoaderCircle size={16} className="animate-spin" />}
              {isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link
              href={isSignup ? "/signin" : "/signup"}
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>

      <AuthArt />
    </div>
  );
}

function AuthArt() {
  const [a, , b, c, , d] = sampleBoard.data;
  const tiles = [
    { card: a, cls: "row-span-2" },
    { card: b, cls: "" },
    { card: c, cls: "row-span-2" },
    { card: d, cls: "" },
  ];
  return (
    <div className="relative hidden p-3 lg:block">
      <div className="relative grid h-full grid-flow-col grid-cols-2 grid-rows-3 gap-3 overflow-hidden rounded-[2rem]">
        {tiles.map(({ card, cls }) => (
          <div key={card.title} className={"relative overflow-hidden rounded-2xl " + cls}>
            <CoverImage eager src={card.image.src} alt="" className="absolute inset-0 size-full" />
          </div>
        ))}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        <p className="absolute inset-x-10 bottom-10 font-display text-5xl leading-tight text-balance text-white">
          What you picture, you move toward.
        </p>
      </div>
    </div>
  );
}
