"use client";
import { AuthProvider } from "./AuthProvider";
import { BoardProvider } from "./BoardProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BoardProvider>{children}</BoardProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
