import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "./config";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(firebaseAuth(), email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(firebaseAuth(), email, password);

export const signOut = () => firebaseSignOut(firebaseAuth());

/**
 * Signs in with Google in a popup. If the browser blocks the popup, falls
 * back to a full-page redirect (the user comes back already signed in).
 */
export async function signInWithGoogle() {
  const auth = firebaseAuth();
  const google = new GoogleAuthProvider();
  google.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, google);
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, google);
      return;
    }
    throw err;
  }
}

/** Errors that mean "the user changed their mind": show nothing. */
export const isCancelled = (err: unknown) =>
  err instanceof FirebaseError &&
  (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request");

const messages: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match an account.",
  "auth/wrong-password": "That email and password don't match an account.",
  "auth/user-not-found": "That email and password don't match an account.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Can't reach the server. Check your connection.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled in the Firebase project yet.",
  "auth/account-exists-with-different-credential":
    "You already have an account with this email. Sign in the way you did before.",
  "auth/unauthorized-domain": "This site's domain isn't on the Firebase project's authorized list.",
};

export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError && messages[err.code]) return messages[err.code];
  return "Something went wrong. Please try again.";
}
