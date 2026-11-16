"use client";
import { AuthProvider } from "./AuthProvider";
import { BoardProvider } from "./BoardProvider";
import { JournalProvider } from "./JournalProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BoardProvider>
            <JournalProvider>{children}</JournalProvider>
          </BoardProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
