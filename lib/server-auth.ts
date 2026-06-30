import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  if (!getApps().length) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  return getApps()[0];
}

export async function verifyFirebaseUser(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7);

  const app = getAdminApp();
  if (app) {
    try {
      const decoded = await getAuth(app).verifyIdToken(idToken);
      return decoded.uid;
    } catch {
      /* try REST fallback */
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0]?.localId || null;
  } catch {
    return null;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return !!(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}
