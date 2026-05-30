import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import type { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (typeof window !== "undefined" && window.location.search.includes("demo=1")
      ? "demo-mode"
      : "test-api-key"),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (typeof window !== "undefined" && window.location.search.includes("demo=1")
      ? "demo-mode.firebaseapp.com"
      : "test-project.firebaseapp.com"),
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (typeof window !== "undefined" && window.location.search.includes("demo=1")
      ? "demo-mode"
      : "test-project"),
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (typeof window !== "undefined" && window.location.search.includes("demo=1")
      ? "demo-mode.appspot.com"
      : "test-project.appspot.com"),
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:000000000000:web:0000000000000000000000",
};

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

// Skip Firebase initialization in demo mode
if (
  typeof window !== "undefined" &&
  window.location.search.includes("demo=1")
) {
  // Create mock Firebase app for demo mode
  app = {} as FirebaseApp;
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      // Immediately call with null (no Firebase user in demo mode)
      cb(null);
      return () => {};
    },
  } as any;
  googleProvider = {} as GoogleAuthProvider;
} else {
  // Try real Firebase initialization
  try {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch {
    // Fallback for invalid config
    app = {} as FirebaseApp;
    auth = {} as any;
    googleProvider = {} as GoogleAuthProvider;
  }
}

export { app, auth, googleProvider };
