import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { isDemoMode, getDemoLeads, updateDemoLead, addDemoLead } from "./demo-data";
import { normalizeFollowUpStatus } from "./follow-up";
import {
  Lead,
  LeadInput,
  Note,
  PipelineStage,
  applyStageToBooleans,
  derivePipelineStage,
  inferAssetBuckets,
  inferTags,
  LeadStatus,
} from "./types";

const LEADS_COLLECTION = "leads";

function followUpFromStatus(status?: LeadStatus | ""): Lead["followUpPriority"] {
  if (!status) return "";
  return normalizeFollowUpStatus(String(status));
}

function docToLead(id: string, data: Record<string, unknown>): Lead {
  return {
    id,
    companyName: (data.companyName as string) || "",
    website: (data.website as string) || "",
    sponsorshipBucket: (data.sponsorshipBucket as string) || "",
    status: (data.status as Lead["status"]) || "",
    owner: (data.owner as Lead["owner"]) || "",
    internalNotes: (data.internalNotes as string) || "",
    level2026: (data.level2026 as Lead["level2026"]) || "",
    amount2026: Number(data.amount2026) || 0,
    invoiceSentDate: (data.invoiceSentDate as string) || "",
    paidAmount: Number(data.paidAmount) || 0,
    outstandingAmount: Number(data.outstandingAmount) || 0,
    level2025: (data.level2025 as Lead["level2025"]) || "",
    amount2025: Number(data.amount2025) || 0,
    delta2625: Number(data.delta2625) || 0,
    jumpBallAmount: Number(data.jumpBallAmount) || 0,
    slaSentTo: (data.slaSentTo as string) || "",
    invoiceSentTo: (data.invoiceSentTo as string) || "",
    marketingContact: (data.marketingContact as Lead["marketingContact"]) || { name: "", email: "" },
    businessContact: (data.businessContact as Lead["businessContact"]) || { name: "", email: "" },
    marketingContact2: (data.marketingContact2 as Lead["marketingContact2"]) || { name: "", email: "" },
    businessContact2: (data.businessContact2 as Lead["businessContact2"]) || { name: "", email: "" },
    historicalAmounts: (data.historicalAmounts as Lead["historicalAmounts"]) || [],
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string) || new Date().toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : (data.updatedAt as string) || new Date().toISOString(),
    pipelineStage: (data.pipelineStage as PipelineStage) || "New Lead",
    assetBuckets: (data.assetBuckets as Lead["assetBuckets"]) || [],
    firmType: (data.firmType as Lead["firmType"]) || "",
    tags: (data.tags as string[]) || [],
    linkedinConnected: Boolean(data.linkedinConnected),
    reachedOut: Boolean(data.reachedOut),
    responded: Boolean(data.responded),
    meetingHeld: Boolean(data.meetingHeld),
    offerSent: Boolean(data.offerSent),
    invoiceSent: Boolean(data.invoiceSent),
    paid: Boolean(data.paid),
    isSponsor: Boolean(data.isSponsor),
    declined: Boolean(data.declined),
    notes: (data.notes as Note[]) || [],
    followUpPriority: (data.followUpPriority as Lead["followUpPriority"]) || "",
    spreadsheetContacts: (data.spreadsheetContacts as Lead["spreadsheetContacts"]) || [],
  };
}

function leadToFirestore(lead: Partial<LeadInput>) {
  const now = Timestamp.now();
  return {
    ...lead,
    updatedAt: now,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  if (isDemoMode()) return getDemoLeads();
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(collection(db, LEADS_COLLECTION), orderBy("companyName"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToLead(d.id, d.data()));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (isDemoMode()) return getDemoLeads().find((l) => l.id === id) || null;
  const db = getFirebaseDb();
  if (!db) return null;
  const docRef = doc(db, LEADS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return docToLead(snapshot.id, snapshot.data());
}

export async function getLeadByCompanyName(name: string): Promise<Lead | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const q = query(
    collection(db, LEADS_COLLECTION),
    where("companyName", "==", name)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return docToLead(snapshot.docs[0].id, snapshot.docs[0].data());
}

export async function createLead(input: Partial<LeadInput>): Promise<string> {
  if (isDemoMode()) return addDemoLead(input as Partial<Lead>);
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");
  const now = Timestamp.now();
  const paidAmount = Number(input.paidAmount) || 0;
  const sponsorshipBucket = input.sponsorshipBucket || "";
  const isSponsor =
    sponsorshipBucket === "Committed" || Boolean(input.isSponsor) || paidAmount > 0;

  const leadData = {
    companyName: input.companyName || "",
    website: input.website || "",
    sponsorshipBucket,
    status: input.status || "",
    owner: input.owner || "",
    internalNotes: input.internalNotes || "",
    level2026: input.level2026 || "",
    amount2026: Number(input.amount2026) || 0,
    invoiceSentDate: input.invoiceSentDate || "",
    paidAmount,
    outstandingAmount: Number(input.outstandingAmount) || 0,
    level2025: input.level2025 || "",
    amount2025: Number(input.amount2025) || 0,
    delta2625: Number(input.delta2625) || 0,
    jumpBallAmount: Number(input.jumpBallAmount) || 0,
    slaSentTo: input.slaSentTo || "",
    invoiceSentTo: input.invoiceSentTo || "",
    marketingContact: input.marketingContact || { name: "", email: "" },
    businessContact: input.businessContact || { name: "", email: "" },
    marketingContact2: input.marketingContact2 || { name: "", email: "" },
    businessContact2: input.businessContact2 || { name: "", email: "" },
    historicalAmounts: input.historicalAmounts || [],
    assetBuckets: input.assetBuckets?.length
      ? input.assetBuckets
      : inferAssetBuckets(sponsorshipBucket),
    firmType: input.firmType || "",
    tags: input.tags?.length ? input.tags : inferTags(input),
    linkedinConnected: Boolean(input.linkedinConnected),
    reachedOut: Boolean(input.reachedOut),
    responded: Boolean(input.responded),
    meetingHeld: Boolean(input.meetingHeld),
    offerSent: Boolean(input.offerSent),
    invoiceSent: Boolean(input.invoiceSent) || Boolean(input.invoiceSentDate),
    paid: paidAmount > 0 || Boolean(input.paid),
    isSponsor,
    declined: Boolean(input.declined) || input.status === "Declined",
    pipelineStage:
      input.pipelineStage ||
      derivePipelineStage({
        ...input,
        paid: paidAmount > 0,
        isSponsor,
      }),
    notes: input.notes || [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, LEADS_COLLECTION), leadData);
  return docRef.id;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  if (isDemoMode()) {
    updateDemoLead(id, updates);
    return;
  }
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, LEADS_COLLECTION, id);
  const { id: _id, createdAt, ...rest } = updates;
  const data = leadToFirestore(rest as Partial<LeadInput>);
  if (updates.pipelineStage) {
    Object.assign(data, applyStageToBooleans(updates.pipelineStage));
  }
  await updateDoc(docRef, data);
}

export async function updateLeadStage(id: string, stage: PipelineStage): Promise<void> {
  const stageUpdates = applyStageToBooleans(stage);
  await updateLead(id, { pipelineStage: stage, ...stageUpdates });
}

export async function addNoteToLead(
  leadId: string,
  text: string,
  author: string,
  authorEmail?: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");

  const note: Note = {
    id: crypto.randomUUID(),
    text,
    author,
    authorEmail,
    createdAt: new Date().toISOString(),
  };

  const notes = [note, ...(lead.notes || [])];
  await updateLead(leadId, { notes });
}

export async function deleteLead(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
}

export async function importLeads(
  leads: Partial<LeadInput>[]
): Promise<{ imported: number; skipped: number; errors: number }> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const existing = await getAllLeads();
  const existingNames = new Set(
    existing.map((l) => l.companyName.toLowerCase().trim())
  );

  let batch = writeBatch(db);
  let batchCount = 0;

  for (const input of leads) {
    const name = (input.companyName || "").trim();
    if (!name) {
      errors++;
      continue;
    }
    if (existingNames.has(name.toLowerCase())) {
      skipped++;
      continue;
    }

    try {
      const now = Timestamp.now();
      const paidAmount = Number(input.paidAmount) || 0;
      const sponsorshipBucket = input.sponsorshipBucket || "";
      const docRef = doc(collection(db, LEADS_COLLECTION));
      const leadData = {
        companyName: name,
        website: input.website || "",
        sponsorshipBucket,
        status: input.status || "",
        owner: input.owner || "",
        internalNotes: input.internalNotes || "",
        level2026: input.level2026 || "",
        amount2026: Number(input.amount2026) || 0,
        invoiceSentDate: input.invoiceSentDate || "",
        paidAmount,
        outstandingAmount: Number(input.outstandingAmount) || 0,
        level2025: input.level2025 || "",
        amount2025: Number(input.amount2025) || 0,
        delta2625: Number(input.delta2625) || 0,
        jumpBallAmount: Number(input.jumpBallAmount) || 0,
        slaSentTo: input.slaSentTo || "",
        invoiceSentTo: input.invoiceSentTo || "",
        marketingContact: input.marketingContact || { name: "", email: "" },
        businessContact: input.businessContact || { name: "", email: "" },
        marketingContact2: input.marketingContact2 || { name: "", email: "" },
        businessContact2: input.businessContact2 || { name: "", email: "" },
        historicalAmounts: input.historicalAmounts || [],
        assetBuckets: input.assetBuckets?.length
          ? input.assetBuckets
          : inferAssetBuckets(sponsorshipBucket),
        firmType: input.firmType || "",
        tags: input.tags?.length ? input.tags : inferTags(input),
        linkedinConnected: Boolean(input.linkedinConnected),
        reachedOut: Boolean(input.reachedOut),
        responded: Boolean(input.responded),
        meetingHeld: Boolean(input.meetingHeld),
        offerSent: Boolean(input.offerSent),
        invoiceSent: Boolean(input.invoiceSent) || Boolean(input.invoiceSentDate),
        paid: paidAmount > 0 || Boolean(input.paid),
        isSponsor: sponsorshipBucket === "Committed" || paidAmount > 0,
        declined: Boolean(input.declined) || input.status === "Declined",
        followUpPriority: input.followUpPriority || followUpFromStatus(input.status),
        spreadsheetContacts: input.spreadsheetContacts || [],
        pipelineStage:
          input.pipelineStage ||
          derivePipelineStage({ ...input, paid: paidAmount > 0 }),
        notes: input.internalNotes
          ? [
              {
                id: crypto.randomUUID(),
                text: input.internalNotes,
                author: "Migration",
                createdAt: now.toDate().toISOString(),
              },
            ]
          : [],
        createdAt: now,
        updatedAt: now,
      };
      batch.set(docRef, leadData);
      batchCount++;
      existingNames.add(name.toLowerCase());
      imported++;

      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    } catch {
      errors++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { imported, skipped, errors };
}

function buildLeadDocument(input: Partial<LeadInput>, existingNotes?: Note[]) {
  const now = Timestamp.now();
  const paidAmount = Number(input.paidAmount) || 0;
  const sponsorshipBucket = input.sponsorshipBucket || "";

  return {
    companyName: (input.companyName || "").trim(),
    website: input.website || "",
    sponsorshipBucket,
    status: input.status || "",
    owner: input.owner || "",
    internalNotes: input.internalNotes || "",
    level2026: input.level2026 || "",
    amount2026: Number(input.amount2026) || 0,
    invoiceSentDate: input.invoiceSentDate || "",
    paidAmount,
    outstandingAmount: Number(input.outstandingAmount) || 0,
    level2025: input.level2025 || "",
    amount2025: Number(input.amount2025) || 0,
    delta2625: Number(input.delta2625) || 0,
    jumpBallAmount: Number(input.jumpBallAmount) || 0,
    slaSentTo: input.slaSentTo || "",
    invoiceSentTo: input.invoiceSentTo || "",
    marketingContact: input.marketingContact || { name: "", email: "" },
    businessContact: input.businessContact || { name: "", email: "" },
    marketingContact2: input.marketingContact2 || { name: "", email: "" },
    businessContact2: input.businessContact2 || { name: "", email: "" },
    historicalAmounts: input.historicalAmounts || [],
    assetBuckets: input.assetBuckets?.length
      ? input.assetBuckets
      : inferAssetBuckets(sponsorshipBucket),
    firmType: input.firmType || "",
    tags: input.tags?.length ? input.tags : inferTags(input),
    linkedinConnected: Boolean(input.linkedinConnected),
    reachedOut: Boolean(input.reachedOut),
    responded: Boolean(input.responded),
    meetingHeld: Boolean(input.meetingHeld),
    offerSent: Boolean(input.offerSent),
    invoiceSent: Boolean(input.invoiceSent) || Boolean(input.invoiceSentDate),
    paid: paidAmount > 0 || Boolean(input.paid),
    isSponsor: sponsorshipBucket === "Committed" || paidAmount > 0 || Boolean(input.isSponsor),
    declined: Boolean(input.declined) || input.status === "Declined",
    followUpPriority: input.followUpPriority || followUpFromStatus(input.status),
    spreadsheetContacts: input.spreadsheetContacts || [],
    pipelineStage:
      input.pipelineStage ||
      derivePipelineStage({ ...input, paid: paidAmount > 0 }),
    notes: existingNotes || [],
    updatedAt: now,
  };
}

/** Upsert leads from spreadsheet — xlsx is source of truth; preserves in-app notes. */
export async function upsertLeadsFromSpreadsheet(
  leads: Partial<LeadInput>[]
): Promise<{ created: number; updated: number; errors: number; rowCount: number }> {
  if (isDemoMode()) {
    return { created: 0, updated: 0, errors: 0, rowCount: leads.length };
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore not initialized");

  const existing = await getAllLeads();
  const byName = new Map(
    existing.map((l) => [l.companyName.toLowerCase().trim(), l])
  );

  let created = 0;
  let updated = 0;
  let errors = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const input of leads) {
    const name = (input.companyName || "").trim();
    if (!name) {
      errors++;
      continue;
    }

    try {
      const key = name.toLowerCase();
      const existingLead = byName.get(key);
      const preservedNotes = existingLead?.notes || [];

      if (existingLead) {
        const docRef = doc(db, LEADS_COLLECTION, existingLead.id);
        const data = buildLeadDocument(input, preservedNotes);
        batch.update(docRef, data);
        updated++;
      } else {
        const now = Timestamp.now();
        const docRef = doc(collection(db, LEADS_COLLECTION));
        const data = {
          ...buildLeadDocument(input, []),
          createdAt: now,
        };
        batch.set(docRef, data);
        created++;
      }

      batchCount++;
      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    } catch {
      errors++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { created, updated, errors, rowCount: leads.length };
}

export function getDashboardStats(leads: Lead[]) {
  const totalLeads = leads.length;
  const activeProspects = leads.filter(
    (l) => !l.isSponsor && !l.declined && l.status !== "Declined"
  ).length;
  const sponsorsThisYear = leads.filter((l) => l.isSponsor || l.paid).length;
  const outstandingRevenue = leads.reduce(
    (sum, l) => sum + (l.outstandingAmount || 0),
    0
  );

  const stageCounts: Record<PipelineStage, number> = {
    "New Lead": 0,
    "LinkedIn Connected": 0,
    "Reached Out": 0,
    Responded: 0,
    "Meeting / Call Held": 0,
    "Offer Sent": 0,
    "Invoice Sent": 0,
    Sponsor: 0,
  };

  leads.forEach((l) => {
    const stage = l.pipelineStage || "New Lead";
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  });

  const tierCounts = { Platinum: 0, Diamond: 0, Gold: 0, Silver: 0, Unknown: 0 };
  let totalCommitted = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;

  leads
    .filter((l) => l.isSponsor || l.paid)
    .forEach((l) => {
      const tier = l.level2026 || "Unknown";
      if (tier in tierCounts) {
        tierCounts[tier as keyof typeof tierCounts]++;
      } else {
        tierCounts.Unknown++;
      }
      totalCommitted += l.amount2026 || 0;
      totalPaid += l.paidAmount || 0;
      totalOutstanding += l.outstandingAmount || 0;
    });

  return {
    totalLeads,
    activeProspects,
    sponsorsThisYear,
    outstandingRevenue,
    stageCounts,
    tierCounts,
    totalCommitted,
    totalPaid,
    totalOutstanding,
  };
}
