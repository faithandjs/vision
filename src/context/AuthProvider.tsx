"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/firebase/config";

interface AuthState {
  user: User | null;
  /** True until Firebase has told us whether someone is signed in. */
  loading: boolean;
  configured: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ user: null as User | null, loading: isFirebaseConfigured });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (user) => setState({ user, loading: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, configured: isFirebaseConfigured }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
