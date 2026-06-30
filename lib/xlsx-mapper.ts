import * as XLSX from "xlsx";
import {
  applyFollowUpFromNotStartedSheet,
  companyKey,
  injectNotStartedOnlyLeads,
  matchCompanyName,
  normalizeFollowUpStatus,
} from "./follow-up";
import {
  derivePipelineStage,
  inferAssetBuckets,
  inferTags,
  LeadInput,
  Contact,
} from "./types";

export const XLSX_STORAGE_PATH = "STA-Sponsors.xlsx";
export const XLSX_SHEET_NAME = "2026 Sponsors";
export const NOT_STARTED_SHEET_NAMES = ["Not Started", "Not started", "NOT STARTED"];
export const HUBSPOT_SHEET_NAMES = ["HubSpot - General", "HubSpot - OIC"];

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

function parseHubSpotContactRow(row: Record<string, unknown>): Contact | null {
  const first = parseString(findColumn(row, "First Name", "First name"));
  const last = parseString(findColumn(row, "Last Name", "Last name"));
  const email = parseString(findColumn(row, "Email", "Email Address"));
  const company = parseString(findColumn(row, "Company", "Firm", "Company Name"));
  const title = parseString(findColumn(row, "Title"));

  if (!email || !company) return null;

  return {
    name: [first, last].filter(Boolean).join(" ") || email.split("@")[0],
    email,
    title: title || undefined,
    source: "xlsx-hubspot-tab",
  };
}

export function parseHubSpotSheets(workbook: XLSX.WorkBook): Map<string, Contact[]> {
  const byCompany = new Map<string, Contact[]>();

  for (const sheetName of workbook.SheetNames) {
    if (!HUBSPOT_SHEET_NAMES.some((n) => n.toLowerCase() === sheetName.toLowerCase())) {
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    for (const row of rows) {
      const contact = parseHubSpotContactRow(row);
      if (!contact) continue;

      const company = parseString(findColumn(row, "Company", "Firm", "Company Name"));
      const key = companyKey(company);
      const list = byCompany.get(key) || [];
      const exists = list.some((c) => c.email.toLowerCase() === contact.email.toLowerCase());
      if (!exists) list.push(contact);
      byCompany.set(key, list);
    }
  }

  return byCompany;
}

export function parseNotStartedSheet(workbook: XLSX.WorkBook): Set<string> {
  const companies = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    if (!NOT_STARTED_SHEET_NAMES.some((n) => n.toLowerCase() === sheetName.toLowerCase())) {
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    for (const row of rows) {
      const company = parseString(
        findColumn(row, "Company", "Company Name", "Firm", "Company_1")
      );
      if (company) companies.add(company);
    }
  }

  return companies;
}

function attachSpreadsheetContacts(
  lead: Partial<LeadInput>,
  hubspotByCompany: Map<string, Contact[]>
): Partial<LeadInput> {
  const key = companyKey(lead.companyName || "");
  let extra = hubspotByCompany.get(key) || [];

  if (extra.length === 0) {
    for (const [companyKeyName, contacts] of Array.from(hubspotByCompany.entries())) {
      if (matchCompanyName(lead.companyName || "", companyKeyName)) {
        extra = contacts;
        break;
      }
    }
  }

  if (extra.length === 0) return lead;
  return { ...lead, spreadsheetContacts: extra };
}

export function mapRowToLead(row: Record<string, unknown>): Partial<LeadInput> {
  const companyName = parseString(findColumn(row, "Company Name", "Company", "company name", "Firm"));
  const sponsorshipBucket = parseString(findColumn(row, "Sponsorship Bucket", "Bucket"));
  const status = parseString(findColumn(row, "Status"));
  const owner = parseString(findColumn(row, "Owner"));
  const internalNotes = parseString(findColumn(row, "Internal Notes", "Notes", "internal notes"));
  const level2026 = parseString(findColumn(row, "2026 Level", "Level 2026"));
  const amount2026 = parseNumber(findColumn(row, "2026 Amount", "Amount 2026"));
  const invoiceSentDate = parseString(findColumn(row, "Invoice Sent date", "Invoice Sent Date", "Invoice Sent"));
  const paidAmount = parseNumber(findColumn(row, "Paid amount", "Paid Amount", "Paid"));
  const outstandingAmount = parseNumber(
    findColumn(row, "Outstanding amount", "Outstanding Amount", "Outstanding")
  );
  const level2025 = parseString(findColumn(row, "2025 Level", "Level 2025"));
  const amount2025 = parseNumber(findColumn(row, "2025 Amount", "Amount 2025"));
  const delta2625 = parseNumber(findColumn(row, "26 vs 25 delta", "Delta", "26 vs 25", "26 vs '25"));
  const jumpBallAmount = parseNumber(findColumn(row, "Jump Ball amount", "Jump Ball", "Jump Ball "));
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
  const statusLower = status.toLowerCase();
  const reachedOut = statusLower === "sent email" || status === "Sent Email";
  const responded = status === "Replied";
  const meetingHeld = status === "In Progress";
  const offerSent = status === "Hot";
  const declined = status === "Declined";
  const followUpPriority = normalizeFollowUpStatus(status);

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
    followUpPriority,
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

  const hubspotByCompany = parseHubSpotSheets(workbook);
  const notStartedCompanies = parseNotStartedSheet(workbook);

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  let leads = rows
    .map(mapRowToLead)
    .filter((l) => l.companyName?.trim())
    .map((l) => attachSpreadsheetContacts(l, hubspotByCompany));

  leads = applyFollowUpFromNotStartedSheet(leads, notStartedCompanies);
  leads = injectNotStartedOnlyLeads(leads, notStartedCompanies, hubspotByCompany);

  return leads;
}
