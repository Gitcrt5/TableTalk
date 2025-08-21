import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, getRedirectResult, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "***PROVIDED***" : "MISSING",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  appId: firebaseConfig.appId ? "***PROVIDED***" : "MISSING"
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase app initialized successfully");

const provider = new GoogleAuthProvider();
// Add required OAuth scopes and parameters
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = () => {
  console.log("signInWithGoogle called - initiating popup");
  return signInWithPopup(auth, provider);
};

export const handleRedirectResult = () => {
  return getRedirectResult(auth);
};

export const signOutUser = () => {
  return signOut(auth);
};

export { onAuthStateChanged };
