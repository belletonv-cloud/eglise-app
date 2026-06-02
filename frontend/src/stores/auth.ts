import { ref } from "vue";
import { auth, googleProvider, firebaseReady } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

let redirectAfterLogin: (() => void) | null = null;

// Auth init barrier: on first page load, Firebase auth state is async.
// Without this, router guards can redirect to /login before onAuthStateChanged fires.
export const authInitialized = ref(false);
let _resolveAuthInit: (() => void) | null = null;
const _authInitPromise = new Promise<void>((resolve) => {
  _resolveAuthInit = resolve;
});
export async function waitForAuthInitialized(): Promise<void> {
  if (authInitialized.value) return;
  await _authInitPromise;
}
function markAuthInitialized() {
  if (authInitialized.value) return;
  authInitialized.value = true;
  _resolveAuthInit?.();
}

export function onLogin(cb: () => void) {
  redirectAfterLogin = cb;
}

export function startImpersonating(personaUser: any) {
  // Ne sauvegarde originalUser que si ce n'est pas déjà un impersonation
  if (!isImpersonating.value && !originalUser.value) {
    originalUser.value = user.value;
  }
  user.value = personaUser;
  isImpersonating.value = true;
}

export function stopImpersonating() {
  if (originalUser.value) {
    user.value = originalUser.value;
    // Ne pas mettre originalUser à null - garder l'admin original pour pouvoir réimpersonnaliser
  }
  isImpersonating.value = false;
}

export const user = ref<any>(null);
export const isAuthenticated = ref(false);

// Demo mode flag (checked by member store for initial role)
export const isDemoMode = ref(false);

// Impersonation state
export const isImpersonating = ref(false);
export const originalUser = ref<any>(null);

// Démo locale : si ?demo=1 dans l'URL, on skip Firebase Auth
if (
  typeof window !== "undefined" &&
  window.location.search.includes("demo=1")
) {
  isAuthenticated.value = true;
  user.value = {
    email: "admin@demo.church",
    uid: "demo123",
    displayName: "Admin Démo",
  };
  originalUser.value = { ...user.value }; // Store original for impersonation display
  isDemoMode.value = true;
  markAuthInitialized();
}

if (firebaseReady) {
  onAuthStateChanged(auth, (firebaseUser: any) => {
    // Ne pas override le mode demo local
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("demo=1")
    ) {
      markAuthInitialized();
      return;
    }
    if (firebaseUser) {
      user.value = firebaseUser;
      if (!originalUser.value) originalUser.value = firebaseUser;
      isAuthenticated.value = true;
      redirectAfterLogin?.();
    } else {
      user.value = null;
      isAuthenticated.value = false;
    }
    markAuthInitialized();
  });
} else if (typeof auth.onAuthStateChanged === "function") {
  // Use mock onAuthStateChanged (demo or missing config)
  auth.onAuthStateChanged((firebaseUser: any) => {
    // Ne pas override le mode demo local
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("demo=1")
    ) {
      markAuthInitialized();
      return;
    }
    if (firebaseUser) {
      user.value = firebaseUser;
      isAuthenticated.value = true;
      redirectAfterLogin?.();
    } else {
      user.value = null;
      isAuthenticated.value = false;
    }
    markAuthInitialized();
  });
} else {
  // No Firebase, no mock: consider auth resolved (unauthenticated)
  markAuthInitialized();
}

export const loginWithEmail = async (email: string, password: string) => {
  if (!firebaseReady) return;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async () => {
  if (!firebaseReady) return;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  if (
    typeof window !== "undefined" &&
    window.location.search.includes("demo=1")
  ) {
    isAuthenticated.value = false;
    user.value = null;
    return;
  }
  if (!firebaseReady) {
    isAuthenticated.value = false;
    user.value = null;
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};
