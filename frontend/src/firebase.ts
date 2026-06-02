import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import type { FirebaseApp } from "firebase/app";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const isDemo =
  typeof window !== "undefined" && window.location.search.includes("demo=1");

const hasValidConfig = !!(apiKey && projectId);

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

// Skip real Firebase initialization in demo mode or if config is missing
if (isDemo || !hasValidConfig) {
  // Create mock Firebase app for demo mode or missing config
  app = {} as FirebaseApp;
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
  } as any;
  googleProvider = {} as GoogleAuthProvider;
} else {
  try {
    app = getApps().length ? getApps()[0]! : initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase init failed", e);
    app = {} as FirebaseApp;
    auth = {
      currentUser: null,
      onAuthStateChanged: (cb: any) => {
        cb(null);
        return () => {};
      },
    } as any;
    googleProvider = {} as GoogleAuthProvider;
  }
}

const firebaseReady = !isDemo && hasValidConfig;

export { app, auth, googleProvider, firebaseReady };
