import * as XLSX from "xlsx";
import {
  derivePipelineStage,
  inferAssetBuckets,
  inferTags,
  LeadInput,
} from "./types";

export const XLSX_STORAGE_PATH = "STA-Sponsors.xlsx";
export const XLSX_SHEET_NAME = "2026 Sponsors";

export function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(String(val).replace(/[$,]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function parseString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function findColumn(row: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === name.toLowerCase()
    );
    if (key) return row[key];
  }
  return "";
}

export function mapRowToLead(row: Record<string, unknown>): Partial<LeadInput> {
  const companyName = parseString(findColumn(row, "Company Name", "Company", "company name"));
  const sponsorshipBucket = parseString(findColumn(row, "Sponsorship Bucket", "Bucket"));
  const status = parseString(findColumn(row, "Status"));
  const owner = parseString(findColumn(row, "Owner"));
  const internalNotes = parseString(findColumn(row, "Internal Notes", "Notes", "internal notes"));
  const level2026 = parseString(findColumn(row, "2026 Level", "Level 2026"));
  const amount2026 = parseNumber(findColumn(row, "2026 Amount", "Amount 2026"));
  const invoiceSentDate = parseString(findColumn(row, "Invoice Sent date", "Invoice Sent Date"));
  const paidAmount = parseNumber(findColumn(row, "Paid amount", "Paid Amount", "Paid"));
  const outstandingAmount = parseNumber(findColumn(row, "Outstanding amount", "Outstanding Amount", "Outstanding"));
  const level2025 = parseString(findColumn(row, "2025 Level", "Level 2025"));
  const amount2025 = parseNumber(findColumn(row, "2025 Amount", "Amount 2025"));
  const delta2625 = parseNumber(findColumn(row, "26 vs 25 delta", "Delta", "26 vs 25"));
  const jumpBallAmount = parseNumber(findColumn(row, "Jump Ball amount", "Jump Ball"));
  const slaSentTo = parseString(findColumn(row, "SLA Sent To"));
  const invoiceSentTo = parseString(findColumn(row, "Invoice Sent To"));

  const marketingContact = {
    name: parseString(findColumn(row, "Marketing Contact name", "Marketing Contact Name", "Marketing Contact")),
    email: parseString(findColumn(row, "Marketing Contact email", "Marketing Contact Email")),
  };
  const businessContact = {
    name: parseString(findColumn(row, "Business Contact name", "Business Contact Name", "Business Contact")),
    email: parseString(findColumn(row, "Business Contact email", "Business Contact Email")),
  };
  const marketingContact2 = {
    name: parseString(findColumn(row, "Marketing Contact #2 name", "Marketing Contact 2 Name")),
    email: parseString(findColumn(row, "Marketing Contact #2 email", "Marketing Contact 2 Email")),
  };
  const businessContact2 = {
    name: parseString(findColumn(row, "Business Contact #2 name", "Business Contact 2 Name")),
    email: parseString(findColumn(row, "Business Contact #2 email", "Business Contact 2 Email")),
  };

  const historicalAmounts: { year: number; amount: number; level?: string }[] = [];
  for (let year = 2015; year <= 2024; year++) {
    const amount = parseNumber(findColumn(row, String(year), `${year} Amount`));
    const level = parseString(findColumn(row, `${year} Level`));
    if (amount > 0 || level) {
      historicalAmounts.push({ year, amount, level: level || undefined });
    }
  }

  const paid = paidAmount > 0;
  const isSponsor = sponsorshipBucket === "Committed" || paid;
  const invoiceSent = Boolean(invoiceSentDate);
  const reachedOut = status === "Sent email";
  const responded = status === "Replied";
  const meetingHeld = status === "In Progress";
  const offerSent = status === "Hot";
  const declined = status === "Declined";

  const input: Partial<LeadInput> = {
    companyName,
    sponsorshipBucket,
    status: status as LeadInput["status"],
    owner: owner as LeadInput["owner"],
    internalNotes,
    level2026: level2026 as LeadInput["level2026"],
    amount2026,
    invoiceSentDate,
    paidAmount,
    outstandingAmount,
    level2025: level2025 as LeadInput["level2025"],
    amount2025,
    delta2625,
    jumpBallAmount,
    slaSentTo,
    invoiceSentTo,
    marketingContact,
    businessContact,
    marketingContact2,
    businessContact2,
    historicalAmounts,
    assetBuckets: inferAssetBuckets(sponsorshipBucket),
    firmType: "",
    linkedinConnected: false,
    reachedOut,
    responded,
    meetingHeld,
    offerSent,
    invoiceSent,
    paid,
    isSponsor,
    declined,
    tags: [],
  };

  input.tags = inferTags(input);
  input.pipelineStage = derivePipelineStage(input);

  return input;
}

export function parseXlsxBuffer(buffer: ArrayBuffer): Partial<LeadInput>[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[XLSX_SHEET_NAME] || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows
    .map(mapRowToLead)
    .filter((l) => l.companyName?.trim());
}
