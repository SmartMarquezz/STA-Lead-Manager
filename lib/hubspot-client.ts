"use client";

import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export interface HubSpotConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  hubId?: string;
  connectedAt: string;
}

export interface HubSpotStatus {
  mode: "static" | "oauth" | "none";
  staticTokenConfigured: boolean;
  oauthConfigured: boolean;
  ready: boolean;
}

export async function getHubSpotStatus(): Promise<HubSpotStatus> {
  const res = await fetch("/api/hubspot/status", { cache: "no-store" });
  const data = await res.json();
  return data as HubSpotStatus;
}

export async function getHubSpotConnection(userId: string): Promise<HubSpotConnection | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, "users", userId));
  const hubspot = snap.data()?.hubspot as HubSpotConnection | undefined;
  return hubspot || null;
}

export async function saveHubSpotConnection(
  userId: string,
  connection: HubSpotConnection
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");

  await setDoc(
    doc(db, "users", userId),
    { hubspot: connection, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function disconnectHubSpot(userId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");

  await setDoc(
    doc(db, "users", userId),
    { hubspot: deleteField(), updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function getHubSpotAuthUrl(idToken: string): Promise<string> {
  const res = await fetch("/api/hubspot/auth-url", {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get HubSpot auth URL");
  return data.url;
}

export async function exchangeHubSpotCode(
  idToken: string,
  code: string
): Promise<HubSpotConnection> {
  const res = await fetch("/api/hubspot/exchange", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "HubSpot connection failed");
  return data.tokens;
}

export async function refreshHubSpotConnection(
  idToken: string,
  refreshToken: string
): Promise<HubSpotConnection> {
  const res = await fetch("/api/hubspot/refresh", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "HubSpot refresh failed");
  return data.tokens;
}

/** Returns OAuth user token if connected; null when using server static token instead. */
export async function getValidHubSpotToken(
  userId: string,
  idToken: string
): Promise<string | null> {
  const status = await getHubSpotStatus();
  if (status.mode === "static") return null;

  const connection = await getHubSpotConnection(userId);
  if (!connection) return null;

  if (connection.expiresAt > Date.now() + 60_000) {
    return connection.accessToken;
  }

  const refreshed = await refreshHubSpotConnection(idToken, connection.refreshToken);
  await saveHubSpotConnection(userId, refreshed);
  return refreshed.accessToken;
}

export async function isHubSpotReady(userId: string): Promise<boolean> {
  const status = await getHubSpotStatus();
  if (status.mode === "static") return true;
  const conn = await getHubSpotConnection(userId);
  return Boolean(conn?.accessToken);
}
