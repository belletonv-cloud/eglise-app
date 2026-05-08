import { ref } from 'vue';
import { auth, googleProvider } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut
} from 'firebase/auth';

export const user = ref<any>(null);
export const isAuthenticated = ref(false);

onAuthStateChanged(auth, (firebaseUser: any) => {
  if (firebaseUser) {
    user.value = firebaseUser;
    isAuthenticated.value = true;
  } else {
    user.value = null;
    isAuthenticated.value = false;
  }
});

export const loginWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};
