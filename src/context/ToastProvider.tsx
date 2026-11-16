"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { LuCheck, LuCircleAlert, LuX } from "react-icons/lu";

type Tone = "success" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);
let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = ++nextId;
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="animate-rise pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 text-sm shadow-xl shadow-black/10 backdrop-blur"
          >
            <span
              className={
                "grid size-6 shrink-0 place-items-center rounded-full " +
                (t.tone === "error" ? "bg-danger/15 text-danger" : "bg-success/15 text-success")
              }
            >
              {t.tone === "error" ? <LuCircleAlert size={14} /> : <LuCheck size={14} />}
            </span>
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded-full p-1 text-muted transition hover:bg-surface-muted hover:text-ink"
            >
              <LuX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
