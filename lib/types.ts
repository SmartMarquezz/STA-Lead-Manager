export type PipelineStage =
  | "New Lead"
  | "LinkedIn Connected"
  | "Reached Out"
  | "Responded"
  | "Meeting / Call Held"
  | "Offer Sent"
  | "Invoice Sent"
  | "Sponsor";

export type Tier = "Platinum" | "Diamond" | "Gold" | "Silver" | "Unknown" | "";

export type Owner = "Jim" | "Dawn" | "Erin" | "Joe" | "Affiliate" | "Other" | "";

export type FirmType =
  | "Exchange"
  | "Market Maker"
  | "Retail"
  | "Vendor"
  | "Broker-Dealer"
  | "";

export type AssetBucket = "Equity" | "Options" | "ETF";

export type LeadStatus =
  | "Hot"
  | "In Progress"
  | "Sent email"
  | "Sent Email"
  | "Not Started"
  | "Replied"
  | "Committed"
  | "Declined"
  | "";

/** Priority buckets for Jim's follow-up dashboard (from STATUS column + Not Started sheet) */
export type FollowUpPriority = "Not Started" | "Hot" | "In Progress" | "Sent Email";

export const FOLLOW_UP_PRIORITIES: FollowUpPriority[] = [
  "Not Started",
  "Hot",
  "In Progress",
  "Sent Email",
];

export interface Contact {
  name: string;
  email: string;
  title?: string;
  source?: "spreadsheet" | "hubspot" | "xlsx-hubspot-tab";
}

export interface Note {
  id: string;
  text: string;
  author: string;
  authorEmail?: string;
  createdAt: string;
}

export interface HistoricalYear {
  year: number;
  amount: number;
  level?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  sponsorshipBucket?: string;
  status?: LeadStatus;
  owner?: Owner;
  internalNotes?: string;
  level2026?: Tier;
  amount2026?: number;
  invoiceSentDate?: string;
  paidAmount?: number;
  outstandingAmount?: number;
  level2025?: Tier;
  amount2025?: number;
  delta2625?: number;
  jumpBallAmount?: number;
  slaSentTo?: string;
  invoiceSentTo?: string;
  marketingContact?: Contact;
  businessContact?: Contact;
  marketingContact2?: Contact;
  businessContact2?: Contact;
  historicalAmounts?: HistoricalYear[];
  createdAt: string;
  updatedAt: string;
  pipelineStage: PipelineStage;
  assetBuckets: AssetBucket[];
  firmType?: FirmType;
  tags: string[];
  linkedinConnected: boolean;
  reachedOut: boolean;
  responded: boolean;
  meetingHeld: boolean;
  offerSent: boolean;
  invoiceSent: boolean;
  paid: boolean;
  isSponsor: boolean;
  declined?: boolean;
  notes?: Note[];
  /** Follow-up bucket derived from STATUS column or Not Started sheet */
  followUpPriority?: FollowUpPriority | "";
  /** Extra contacts parsed from HubSpot tabs in the spreadsheet */
  spreadsheetContacts?: Contact[];
}

export type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;

export const PIPELINE_STAGES: PipelineStage[] = [
  "New Lead",
  "LinkedIn Connected",
  "Reached Out",
  "Responded",
  "Meeting / Call Held",
  "Offer Sent",
  "Invoice Sent",
  "Sponsor",
];

export const TIERS: Tier[] = ["Platinum", "Diamond", "Gold", "Silver", "Unknown"];

export const OWNERS: Owner[] = ["Jim", "Dawn", "Erin", "Joe", "Affiliate", "Other"];

export const FIRM_TYPES: FirmType[] = [
  "Exchange",
  "Market Maker",
  "Retail",
  "Vendor",
  "Broker-Dealer",
];

export const ASSET_BUCKETS: AssetBucket[] = ["Equity", "Options", "ETF"];

export const STAGE_ORDER: Record<PipelineStage, number> = {
  "New Lead": 0,
  "LinkedIn Connected": 1,
  "Reached Out": 2,
  Responded: 3,
  "Meeting / Call Held": 4,
  "Offer Sent": 5,
  "Invoice Sent": 6,
  Sponsor: 7,
};

export function getOwnerInitials(owner?: Owner): string {
  if (!owner) return "?";
  const map: Record<string, string> = {
    Jim: "J",
    Dawn: "D",
    Erin: "E",
    Joe: "Jo",
    Affiliate: "A",
    Other: "O",
  };
  return map[owner] || owner.charAt(0).toUpperCase();
}

export function derivePipelineStage(lead: Partial<Lead>): PipelineStage {
  if (lead.paid || (lead.paidAmount && lead.paidAmount > 0)) return "Sponsor";
  if (lead.invoiceSent || lead.invoiceSentDate) return "Invoice Sent";
  if (lead.offerSent || lead.status === "Hot") return "Offer Sent";
  if (lead.meetingHeld || lead.status === "In Progress") return "Meeting / Call Held";
  if (lead.responded || lead.status === "Replied") return "Responded";
  if (lead.reachedOut || lead.status === "Sent email") return "Reached Out";
  if (lead.linkedinConnected) return "LinkedIn Connected";
  return "New Lead";
}

export function inferAssetBuckets(sponsorshipBucket?: string): AssetBucket[] {
  if (!sponsorshipBucket) return [];
  const buckets: AssetBucket[] = [];
  const lower = sponsorshipBucket.toLowerCase();
  if (lower.includes("etf")) buckets.push("ETF");
  if (lower.includes("options")) buckets.push("Options");
  if (lower.includes("equity")) buckets.push("Equity");
  if (buckets.length === 0 && lower.includes("prospect")) {
    if (lower.includes("etf")) buckets.push("ETF");
  }
  return buckets;
}

export function inferTags(lead: Partial<Lead>): string[] {
  const tags: string[] = [];
  const bucket = lead.sponsorshipBucket?.toLowerCase() || "";
  if (bucket.includes("paid less")) tags.push("Paid Less");
  if (bucket.includes("step up")) tags.push("Step Up");
  if (bucket.includes("no change")) tags.push("No Change");
  if (lead.status === "Declined" || bucket.includes("declined")) tags.push("Declined");
  if (bucket.includes("stany")) tags.push("STANY Sponsor");
  if (lead.owner === "Affiliate" || bucket.includes("affiliate")) tags.push("Affiliate");
  if (lead.jumpBallAmount && lead.jumpBallAmount > 0) tags.push("Jump Ball");
  if (lead.delta2625 && Math.abs(lead.delta2625) > 5000) tags.push("Jump Ball");
  return tags;
}

export function stageFromBooleans(lead: Partial<Lead>): PipelineStage {
  if (lead.declined) return lead.pipelineStage || "New Lead";
  if (lead.paid) return "Sponsor";
  if (lead.invoiceSent) return "Invoice Sent";
  if (lead.offerSent) return "Offer Sent";
  if (lead.meetingHeld) return "Meeting / Call Held";
  if (lead.responded) return "Responded";
  if (lead.reachedOut) return "Reached Out";
  if (lead.linkedinConnected) return "LinkedIn Connected";
  return "New Lead";
}

export function applyStageToBooleans(stage: PipelineStage): Partial<Lead> {
  const stageIndex = STAGE_ORDER[stage];
  return {
    pipelineStage: stage,
    linkedinConnected: stageIndex >= 1,
    reachedOut: stageIndex >= 2,
    responded: stageIndex >= 3,
    meetingHeld: stageIndex >= 4,
    offerSent: stageIndex >= 5,
    invoiceSent: stageIndex >= 6,
    paid: stageIndex >= 7,
    isSponsor: stageIndex >= 7,
  };
}
