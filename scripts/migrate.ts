/**
 * One-time migration script: reads STA-Sponsors.xlsx from project root and seeds Firestore.
 *
 * Usage: npm run migrate
 * Requires FIREBASE_ADMIN_* env vars in .env.local
 *
 * For ongoing sync, upload STA-Sponsors.xlsx via Settings in the app instead.
 */

import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import * as admin from "firebase-admin";
import {
  mapRowToLead,
  XLSX_SHEET_NAME,
} from "../lib/xlsx-mapper";

const XLSX_PATH = path.join(process.cwd(), "STA-Sponsors.xlsx");

function initFirebase() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing FIREBASE_ADMIN_* environment variables.");
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  return admin.firestore();
}

async function migrate() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`File not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  const db = initFirebase();
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets[XLSX_SHEET_NAME] || workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    console.error(`Sheet "${XLSX_SHEET_NAME}" not found.`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  console.log(`Migrating ${rows.length} leads...`);

  const existingSnapshot = await db.collection("leads").get();
  const existingNames = new Set(
    existingSnapshot.docs.map((d) => (d.data().companyName as string)?.toLowerCase().trim())
  );

  let written = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const row of rows) {
    const lead = mapRowToLead(row);
    const name = lead.companyName?.trim();
    if (!name) { skipped++; continue; }
    if (existingNames.has(name.toLowerCase())) { skipped++; continue; }

    const now = admin.firestore.Timestamp.now();
    const docRef = db.collection("leads").doc();
    batch.set(docRef, {
      ...lead,
      notes: lead.internalNotes
        ? [{ id: docRef.id + "-note-0", text: lead.internalNotes, author: "Migration", createdAt: now.toDate().toISOString() }]
        : [],
      createdAt: now,
      updatedAt: now,
    });
    existingNames.add(name.toLowerCase());
    written++;
    batchCount++;

    if (batchCount >= 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`Done. ${written} written, ${skipped} skipped.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
