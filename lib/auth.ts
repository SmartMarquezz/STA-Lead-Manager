"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithPopup(auth, provider);
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
