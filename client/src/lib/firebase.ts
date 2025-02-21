import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Initializing Firebase with config:", {
  ...firebaseConfig,
  apiKey: "REDACTED"
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    console.log("Initiating Google sign-in...");
    await signInWithRedirect(auth, provider);
    console.log("Sign-in redirect initiated");
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};