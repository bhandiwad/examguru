import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}`,
};

console.log("Initializing Firebase with config:", {
  ...firebaseConfig,
  apiKey: "REDACTED"
});

console.log("Current domain:", window.location.origin);
console.log("Current full URL:", window.location.href);

// Only initialize the app if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    console.log("Initiating Google sign-in with redirect...");
    await signInWithRedirect(auth, provider);
    // Note: We won't reach this point as the page will redirect
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

// Handle redirect result
export const handleAuthRedirect = async () => {
  try {
    console.log("Checking redirect result...");
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Sign-in successful:", result.user.email);
      return result;
    } else {
      console.log("No redirect result found");
    }
  } catch (error: any) {
    console.error("Redirect result error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.code === 'auth/unauthorized-domain') {
      console.error("Current domain not authorized. Please add:", window.location.origin);
    }
    throw error;
  }
};