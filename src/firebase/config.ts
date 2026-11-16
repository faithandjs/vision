import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Needed for Realtime Database instances outside the default US region.
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || undefined,
};

/** False when env vars are missing, so the app can run in sample-only mode. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

// Initialized lazily (and only in the browser) so that building or
// prerendering without credentials doesn't crash with auth/invalid-api-key.
function app(): FirebaseApp {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. See .env.example.");
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseAuth = (): Auth => getAuth(app());
export const firebaseDb = (): Database => getDatabase(app());
