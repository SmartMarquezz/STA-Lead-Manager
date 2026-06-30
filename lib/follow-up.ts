import { Contact, FollowUpPriority, Lead, LeadInput } from "./types";

export const FOLLOW_UP_CONFIG: Record<
  FollowUpPriority,
  { label: string; description: string; color: string; bg: string; order: number }
> = {
  "Not Started": {
    label: "Not Started",
    description: "No outreach yet — highest priority",
    color: "#DC2626",
    bg: "#FEF2F2",
    order: 0,
  },
  Hot: {
    label: "Hot",
    description: "Active interest — follow up now",
    color: "#EA580C",
    bg: "#FFF7ED",
    order: 1,
  },
  "In Progress": {
    label: "In Progress",
    description: "Conversation underway",
    color: "#006CB8",
    bg: "#E8F4FA",
    order: 2,
  },
  "Sent Email": {
    label: "Sent Email",
    description: "Awaiting reply — nudge needed",
    color: "#7C3AED",
    bg: "#F5F3FF",
    order: 3,
  },
};

export function normalizeFollowUpStatus(
  rawStatus: string,
  onNotStartedSheet = false
): FollowUpPriority | "" {
  if (onNotStartedSheet) return "Not Started";

  const s = rawStatus.trim().toLowerCase();
  if (!s) return "";
  if (s === "not started") return "Not Started";
  if (s === "hot") return "Hot";
  if (s === "in progress") return "In Progress";
  if (s === "sent email") return "Sent Email";

  return "";
}

export function isFollowUpLead(lead: Lead): boolean {
  if (lead.isSponsor || lead.declined) return false;
  if (lead.status === "Committed" || lead.status === "Declined") return false;
  if (lead.sponsorshipBucket === "Committed") return false;
  return Boolean(lead.followUpPriority);
}

export function groupLeadsByFollowUp(leads: Lead[]): Record<FollowUpPriority, Lead[]> {
  const groups: Record<FollowUpPriority, Lead[]> = {
    "Not Started": [],
    Hot: [],
    "In Progress": [],
    "Sent Email": [],
  };

  for (const lead of leads) {
    if (!isFollowUpLead(lead) || !lead.followUpPriority) continue;
    groups[lead.followUpPriority].push(lead);
  }

  for (const key of Object.keys(groups) as FollowUpPriority[]) {
    groups[key].sort((a, b) => {
      const amountDiff = (b.amount2026 || 0) - (a.amount2026 || 0);
      if (amountDiff !== 0) return amountDiff;
      return a.companyName.localeCompare(b.companyName);
    });
  }

  return groups;
}

export function getContactsFromLead(lead: Lead): Contact[] {
  const seen = new Set<string>();
  const contacts: Contact[] = [];

  const add = (c?: Contact, source: Contact["source"] = "spreadsheet") => {
    const email = c?.email?.trim().toLowerCase();
    if (!email || seen.has(email)) return;
    seen.add(email);
    contacts.push({
      name: c?.name?.trim() || email.split("@")[0],
      email: c!.email.trim(),
      title: c?.title,
      source,
    });
  };

  add(lead.marketingContact, "spreadsheet");
  add(lead.businessContact, "spreadsheet");
  add(lead.marketingContact2, "spreadsheet");
  add(lead.businessContact2, "spreadsheet");

  for (const c of lead.spreadsheetContacts || []) {
    add(c, c.source || "xlsx-hubspot-tab");
  }

  return contacts;
}

export function mergeHubSpotContacts(
  sheetContacts: Contact[],
  hubspotContacts: Contact[]
): Contact[] {
  const seen = new Set<string>();
  const merged: Contact[] = [];

  for (const c of [...hubspotContacts, ...sheetContacts]) {
    const email = c.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    merged.push({ ...c, email: c.email.trim() });
  }

  return merged;
}

export function companyKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchCompanyName(a: string, b: string): boolean {
  const ka = companyKey(a);
  const kb = companyKey(b);
  if (!ka || !kb) return false;
  return ka === kb || ka.includes(kb) || kb.includes(ka);
}

export function applyFollowUpFromNotStartedSheet(
  leads: Partial<LeadInput>[],
  notStartedCompanies: Set<string>
): Partial<LeadInput>[] {
  const notStartedKeys = new Set(Array.from(notStartedCompanies).map(companyKey));

  return leads.map((lead) => {
    const name = (lead.companyName || "").trim();
    const key = companyKey(name);
    const onSheet = notStartedKeys.has(key);

    if (onSheet) {
      return {
        ...lead,
        followUpPriority: "Not Started",
        status: "Not Started" as LeadInput["status"],
      };
    }

    if (!lead.followUpPriority && lead.status) {
      const priority = normalizeFollowUpStatus(String(lead.status));
      if (priority) return { ...lead, followUpPriority: priority };
    }

    return lead;
  });
}

export function injectNotStartedOnlyLeads(
  leads: Partial<LeadInput>[],
  notStartedCompanies: Set<string>,
  hubspotByCompany: Map<string, Contact[]>
): Partial<LeadInput>[] {
  const existing = new Set(leads.map((l) => companyKey(l.companyName || "")));
  const extra: Partial<LeadInput>[] = [];

  for (const company of Array.from(notStartedCompanies)) {
    const key = companyKey(company);
    if (existing.has(key)) continue;

    extra.push({
      companyName: company,
      status: "Not Started",
      followUpPriority: "Not Started",
      spreadsheetContacts: hubspotByCompany.get(key) || [],
      sponsorshipBucket: "",
      owner: "",
      assetBuckets: [],
      tags: [],
      linkedinConnected: false,
      reachedOut: false,
      responded: false,
      meetingHeld: false,
      offerSent: false,
      invoiceSent: false,
      paid: false,
      isSponsor: false,
      pipelineStage: "New Lead",
    });
  }

  return [...leads, ...extra];
}
