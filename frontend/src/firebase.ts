import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'test-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

try {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch {
  app = getApps().length ? getApps()[0]! : initializeApp({ apiKey: 'test', projectId: 'test' });
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { app, auth, googleProvider };