import { Lead } from "./types";

export const DEMO_LEADS: Lead[] = [
  {
    id: "demo-1",
    companyName: "Alpha Exchange",
    website: "https://alphaexchange.com",
    sponsorshipBucket: "Committed",
    status: "Committed",
    owner: "Jim",
    level2026: "Platinum",
    amount2026: 50000,
    paidAmount: 50000,
    outstandingAmount: 0,
    level2025: "Platinum",
    amount2025: 45000,
    delta2625: 5000,
    pipelineStage: "Sponsor",
    assetBuckets: ["Equity", "ETF"],
    firmType: "Exchange",
    tags: ["Step Up"],
    linkedinConnected: true,
    reachedOut: true,
    responded: true,
    meetingHeld: true,
    offerSent: true,
    invoiceSent: true,
    paid: true,
    isSponsor: true,
    marketingContact: { name: "Sarah Chen", email: "sarah@alphaexchange.com" },
    businessContact: { name: "Mike Torres", email: "mike@alphaexchange.com" },
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    notes: [{ id: "n1", text: "Renewed at Platinum level.", author: "Jim", createdAt: "2026-06-01T00:00:00.000Z" }],
  },
  {
    id: "demo-2",
    companyName: "Beta Markets",
    sponsorshipBucket: "Prospect - ETF",
    status: "Hot",
    owner: "Dawn",
    level2026: "Diamond",
    amount2026: 35000,
    paidAmount: 0,
    outstandingAmount: 35000,
    level2025: "Gold",
    amount2025: 25000,
    delta2625: 10000,
    pipelineStage: "Offer Sent",
    assetBuckets: ["ETF"],
    firmType: "Market Maker",
    tags: ["Jump Ball"],
    linkedinConnected: true,
    reachedOut: true,
    responded: true,
    meetingHeld: true,
    offerSent: true,
    invoiceSent: false,
    paid: false,
    isSponsor: false,
    marketingContact: { name: "Lisa Park", email: "lisa@betamarkets.com" },
    businessContact: { name: "James Wu", email: "james@betamarkets.com" },
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-06-25T00:00:00.000Z",
    notes: [{ id: "n2", text: "Very interested in Diamond tier. Follow up this week.", author: "Dawn", createdAt: "2026-06-25T00:00:00.000Z" }],
  },
  {
    id: "demo-3",
    companyName: "Gamma Trading",
    sponsorshipBucket: "Prospect - Options",
    status: "In Progress",
    owner: "Erin",
    level2026: "Gold",
    amount2026: 20000,
    paidAmount: 0,
    outstandingAmount: 0,
    pipelineStage: "Meeting / Call Held",
    assetBuckets: ["Options"],
    firmType: "Retail",
    tags: [],
    linkedinConnected: true,
    reachedOut: true,
    responded: true,
    meetingHeld: true,
    offerSent: false,
    invoiceSent: false,
    paid: false,
    isSponsor: false,
    marketingContact: { name: "Tom Reed", email: "tom@gamma.com" },
    businessContact: { name: "", email: "" },
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-06-18T00:00:00.000Z",
    notes: [],
  },
  {
    id: "demo-4",
    companyName: "Delta Vendor Co",
    sponsorshipBucket: "No Change",
    status: "Sent email",
    owner: "Joe",
    level2026: "Silver",
    amount2026: 10000,
    paidAmount: 0,
    outstandingAmount: 0,
    level2025: "Silver",
    amount2025: 10000,
    pipelineStage: "Reached Out",
    assetBuckets: ["Equity"],
    firmType: "Vendor",
    tags: ["No Change"],
    linkedinConnected: true,
    reachedOut: true,
    responded: false,
    meetingHeld: false,
    offerSent: false,
    invoiceSent: false,
    paid: false,
    isSponsor: false,
    marketingContact: { name: "Anna Lee", email: "anna@deltavendor.com" },
    businessContact: { name: "", email: "" },
    createdAt: "2026-04-05T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    notes: [],
  },
  {
    id: "demo-5",
    companyName: "Epsilon Brokers",
    sponsorshipBucket: "Prospect",
    status: "",
    owner: "Jim",
    level2026: "Unknown",
    amount2026: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    pipelineStage: "New Lead",
    assetBuckets: [],
    firmType: "Broker-Dealer",
    tags: [],
    linkedinConnected: false,
    reachedOut: false,
    responded: false,
    meetingHeld: false,
    offerSent: false,
    invoiceSent: false,
    paid: false,
    isSponsor: false,
    marketingContact: { name: "", email: "" },
    businessContact: { name: "", email: "" },
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
    notes: [],
  },
];

const DEMO_USER = {
  displayName: "Jim (Demo)",
  email: "demo@sta-lead-manager.local",
  photoURL: null as string | null,
  uid: "demo-user",
};

let demoModeActive = false;

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (demoModeActive) return true;
  return localStorage.getItem("sta-demo-mode") === "true";
}

export function enableDemoMode(): void {
  demoModeActive = true;
  if (typeof window !== "undefined") {
    localStorage.setItem("sta-demo-mode", "true");
  }
}

export function disableDemoMode(): void {
  demoModeActive = false;
  if (typeof window !== "undefined") {
    localStorage.removeItem("sta-demo-mode");
  }
}

export function getDemoUser() {
  return DEMO_USER;
}

export function getDemoLeads(): Lead[] {
  return DEMO_LEADS;
}

export function updateDemoLead(id: string, updates: Partial<Lead>): void {
  const idx = DEMO_LEADS.findIndex((l) => l.id === id);
  if (idx >= 0) {
    DEMO_LEADS[idx] = { ...DEMO_LEADS[idx], ...updates, updatedAt: new Date().toISOString() };
  }
}

export function addDemoLead(lead: Partial<Lead>): string {
  const id = `demo-${Date.now()}`;
  DEMO_LEADS.push({
    ...DEMO_LEADS[0],
    ...lead,
    id,
    companyName: lead.companyName || "New Company",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pipelineStage: lead.pipelineStage || "New Lead",
    assetBuckets: lead.assetBuckets || [],
    tags: lead.tags || [],
    linkedinConnected: lead.linkedinConnected ?? false,
    reachedOut: lead.reachedOut ?? false,
    responded: lead.responded ?? false,
    meetingHeld: lead.meetingHeld ?? false,
    offerSent: lead.offerSent ?? false,
    invoiceSent: lead.invoiceSent ?? false,
    paid: lead.paid ?? false,
    isSponsor: lead.isSponsor ?? false,
    notes: lead.notes || [],
  } as Lead);
  return id;
}
