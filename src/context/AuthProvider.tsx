"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/firebase/config";

interface AuthState {
  user: User | null;
  /** True until Firebase has told us whether someone is signed in. */
  loading: boolean;
  configured: boolean;
  /** Updates the signed-in user's name and/or photo, and re-renders everything that shows them. */
  updateUserProfile: (profile: { displayName?: string | null; photoURL?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // `version` changes after a profile update: Firebase mutates the same User
  // object, so without it React wouldn't know to re-render.
  const [state, setState] = useState({ user: null as User | null, loading: isFirebaseConfigured, version: 0 });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (user) => setState((s) => ({ user, loading: false, version: s.version + 1 })));
  }, []);

  const updateUserProfile = useCallback<AuthState["updateUserProfile"]>(async (profile) => {
    const user = firebaseAuth().currentUser;
    if (!user) throw new Error("Not signed in.");
    await updateProfile(user, profile);
    setState((s) => ({ ...s, user, version: s.version + 1 }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: state.user, loading: state.loading, configured: isFirebaseConfigured, updateUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
