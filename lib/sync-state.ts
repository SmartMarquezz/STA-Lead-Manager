import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

const SYNC_DOC_PATH = "config/data-sync";

export interface SyncState {
  lastXlsxUpdated: string | null;
  lastSyncAt: string | null;
  contentHash: string | null;
  source: "sheets" | "local" | "upload" | "none" | null;
  rowCount: number;
  created: number;
  updated: number;
  errors: number;
}

const defaultState: SyncState = {
  lastXlsxUpdated: null,
  lastSyncAt: null,
  contentHash: null,
  source: null,
  rowCount: 0,
  created: 0,
  updated: 0,
  errors: 0,
};

export async function getSyncState(): Promise<SyncState> {
  const db = getFirebaseDb();
  if (!db) return defaultState;

  const snap = await getDoc(doc(db, SYNC_DOC_PATH));
  if (!snap.exists()) return defaultState;
  return { ...defaultState, ...(snap.data() as SyncState) };
}

export async function saveSyncState(state: Partial<SyncState>): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  await setDoc(
    doc(db, SYNC_DOC_PATH),
    { ...state, lastSyncAt: new Date().toISOString() },
    { merge: true }
  );
}
