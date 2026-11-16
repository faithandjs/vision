import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "./config";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(firebaseAuth(), email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(firebaseAuth(), email, password);

export const signOut = () => firebaseSignOut(firebaseAuth());

const messages: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match an account.",
  "auth/wrong-password": "That email and password don't match an account.",
  "auth/user-not-found": "That email and password don't match an account.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Can't reach the server. Check your connection.",
  "auth/operation-not-allowed": "Email/password sign-in isn't enabled in this Firebase project.",
};

export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError && messages[err.code]) return messages[err.code];
  return "Something went wrong. Please try again.";
}
