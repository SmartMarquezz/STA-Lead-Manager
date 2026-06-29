"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export function getAuthErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as AuthError).code)
      : "";

  const host =
    typeof window !== "undefined" ? window.location.hostname : "your-domain.com";

  switch (code) {
    case "auth/unauthorized-domain":
      return `This domain is not authorized in Firebase. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains, then try again.`;
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Google.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Use “Continue with redirect” below, or allow popups for this site.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/cancelled-popup-request":
      return "Sign-in is already in progress. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error during sign-in. Check your connection and try again.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_* values in .env.local or Vercel.";
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Sign-in failed. Please try again or use redirect sign-in.";
  }
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase Auth is not initialized. Add NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithGoogleRedirect(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase Auth is not initialized. Add NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  await signInWithRedirect(auth, provider);
}

export async function completeGoogleRedirectSignIn(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signOut() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth not initialized");
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export type { User };
