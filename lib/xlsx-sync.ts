import { parseXlsxBuffer } from "./xlsx-mapper";
import { getSyncState, saveSyncState } from "./sync-state";
import { upsertLeadsFromSpreadsheet } from "./firestore";
import { isDemoMode } from "./demo-data";

export interface SyncResult {
  success: boolean;
  skipped?: boolean;
  message: string;
  created?: number;
  updated?: number;
  errors?: number;
  rowCount?: number;
  lastXlsxUpdated?: string;
  source?: "sheets" | "local" | "upload" | "none";
}

export interface DataSourceStatus {
  hasSource: boolean;
  sheets: boolean;
  local: boolean;
  uploaded: boolean;
}

async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function downloadFromGoogleSheets(): Promise<ArrayBuffer | null> {
  const fileId =
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FILE_ID;
  if (!fileId) return null;

  const res = await fetch("/api/sheets-export", { cache: "no-store" });
  if (!res.ok) return null;
  return res.arrayBuffer();
}

async function downloadFromLocalApi(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch("/api/xlsx-local?download=1", { cache: "no-store" });
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

async function syncBuffer(
  buffer: ArrayBuffer,
  source: SyncResult["source"],
  force: boolean
): Promise<SyncResult> {
  const syncState = await getSyncState();
  const contentHash = await hashBuffer(buffer);

  if (!force && syncState.contentHash === contentHash) {
    return {
      success: true,
      skipped: true,
      message: "Spreadsheet is up to date",
      lastXlsxUpdated: syncState.lastXlsxUpdated || undefined,
      source,
    };
  }

  const leads = parseXlsxBuffer(buffer);
  const result = await upsertLeadsFromSpreadsheet(leads);
  const now = new Date().toISOString();

  await saveSyncState({
    lastXlsxUpdated: now,
    contentHash,
    source: source || "none",
    rowCount: result.rowCount,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  });

  return {
    success: true,
    message: `Synced ${result.rowCount} rows from ${source} (${result.created} new, ${result.updated} updated)`,
    ...result,
    lastXlsxUpdated: now,
    source,
  };
}

export async function getDataSourceStatus(): Promise<DataSourceStatus> {
  const sheets = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FILE_ID
  );
  let local = false;

  try {
    const res = await fetch("/api/xlsx-local");
    if (res.ok) {
      const data = await res.json();
      local = Boolean(data.exists);
    }
  } catch {
    local = false;
  }

  const syncState = await getSyncState();
  const uploaded = Boolean(syncState.lastXlsxUpdated && syncState.source === "upload");

  return {
    hasSource: sheets || local || uploaded,
    sheets,
    local,
    uploaded,
  };
}

export async function syncFromSources(force = false): Promise<SyncResult> {
  if (isDemoMode()) {
    return { success: true, skipped: true, message: "Demo mode — sync disabled", source: "none" };
  }

  if (
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FILE_ID
  ) {
    try {
      const buffer = await downloadFromGoogleSheets();
      if (buffer) return syncBuffer(buffer, "sheets", force);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Google Sheets sync failed",
        source: "sheets",
      };
    }
  }

  const localBuffer = await downloadFromLocalApi();
  if (localBuffer) {
    return syncBuffer(localBuffer, "local", force);
  }

  const syncState = await getSyncState();
  if (syncState.contentHash) {
    return {
      success: true,
      skipped: true,
      message: "Using last synced data. Configure Google Sheets ID or upload a spreadsheet in Settings.",
      source: "upload",
    };
  }

  return {
    success: false,
    message:
      "No spreadsheet source configured. Upload in Settings, or add NEXT_PUBLIC_GOOGLE_SHEETS_ID to .env.local.",
    source: "none",
  };
}

export async function uploadAndSync(file: File): Promise<SyncResult> {
  if (isDemoMode()) {
    return { success: false, message: "Demo mode — upload disabled", source: "none" };
  }

  try {
    const buffer = await file.arrayBuffer();
    return syncBuffer(buffer, "upload", true);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Upload failed",
      source: "upload",
    };
  }
}

export { getSyncState };
