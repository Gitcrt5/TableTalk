import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

// Configuration object - easily modify to enable/disable methods
export const AUTH_CONFIG = {
  emailPassword: true, // Your current setup
  google: false,       // Disabled in your Firebase console
  passwordReset: true,
  registration: true
};

export const authService = {
  // Email/Password methods
  signInWithEmail: (email: string, password: string) => 
    signInWithEmailAndPassword(auth, email, password),
  
  signUpWithEmail: (email: string, password: string) => 
    createUserWithEmailAndPassword(auth, email, password),
  
  resetPassword: (email: string) => 
    sendPasswordResetEmail(auth, email),
  
  // Google OAuth (when enabled)
  signInWithGoogle: () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return signInWithPopup(auth, provider);
  },
  
  // Universal sign out
  signOut: () => signOut(auth)
};