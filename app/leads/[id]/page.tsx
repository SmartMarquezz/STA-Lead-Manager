"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { getLeadById, addNoteToLead } from "@/lib/firestore";
import { Lead } from "@/lib/types";
import { TierBadge } from "@/components/TierBadge";
import { StageBadge } from "@/components/StageBadge";
import { PipelineSteps } from "@/components/PipelineSteps";
import { ContactCard } from "@/components/ContactCard";
import { LeadForm } from "@/components/LeadForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { PageHero } from "@/components/PageHero";

export default function LeadDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
        </div>
      }
    >
      <LeadDetailContent />
    </Suspense>
  );
}

function LeadDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "true");

  const loadLead = () => {
    const id = params.id as string;
    getLeadById(id).then((data) => {
      setLead(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadLead();
  }, [params.id]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !lead || !user) return;
    setSavingNote(true);
    await addNoteToLead(lead.id, noteText.trim(), user.displayName || "User", user.email || undefined);
    setNoteText("");
    loadLead();
    setSavingNote(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-sta-teal">Lead not found</p>
        <Button asChild className="mt-4">
          <Link href="/leads">Back to Leads</Link>
        </Button>
      </div>
    );
  }

  const historicalYears = lead.historicalAmounts?.length
    ? lead.historicalAmounts
    : [];

  return (
    <>
      <PageHero
        eyebrow={lead.owner ? `Owner: ${lead.owner}` : "Lead Detail"}
        title={lead.companyName}
        subtitle={lead.website ? lead.website : `${lead.pipelineStage} · ${lead.level2026 || "No tier"}`}
        compact
      >
        <div className="flex flex-col gap-3">
          <Button variant="hero-outline" size="sm" asChild>
            <Link href="/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Lead
          </Button>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            <TierBadge tier={lead.level2026} />
            <StageBadge stage={lead.pipelineStage} status={lead.status} />
            {lead.tags?.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <p><span className="font-bold uppercase tracking-wider text-sta-teal">Owner:</span> <span className="text-sta-navy">{lead.owner || "—"}</span></p>
            <p><span className="font-bold uppercase tracking-wider text-sta-teal">Firm Type:</span> <span className="text-sta-navy">{lead.firmType || "—"}</span></p>
            <div className="flex flex-wrap gap-1">
              <span className="font-bold uppercase tracking-wider text-sta-teal">Asset Buckets:</span>
              {lead.assetBuckets?.length ? lead.assetBuckets.map((b) => (
                <Badge key={b} variant="secondary">{b}</Badge>
              )) : <span className="text-sta-navy">—</span>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineSteps lead={lead} onUpdate={loadLead} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">2026 Level</p>
                <p className="text-lg font-semibold text-sta-navy">{lead.level2026 || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">2026 Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(lead.amount2026)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(lead.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="text-lg font-semibold text-amber-600">{formatCurrency(lead.outstandingAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Invoice Sent</p>
                <p className="text-sm">{formatDate(lead.invoiceSentDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">SLA Sent To</p>
                <p className="text-sm">{lead.slaSentTo || "—"}</p>
              </div>
            </div>

            {(historicalYears.length > 0 || lead.amount2025) && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-slate-700">Historical Amounts</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4">Year</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.amount2025 ? (
                        <tr className="border-b">
                          <td className="py-2 pr-4">2025</td>
                          <td className="py-2 pr-4">{formatCurrency(lead.amount2025)}</td>
                          <td className="py-2">{lead.level2025 || "—"}</td>
                        </tr>
                      ) : null}
                      {historicalYears.sort((a, b) => b.year - a.year).map((h) => (
                        <tr key={h.year} className="border-b">
                          <td className="py-2 pr-4">{h.year}</td>
                          <td className="py-2 pr-4">{formatCurrency(h.amount)}</td>
                          <td className="py-2">{h.level || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ContactCard title="Marketing Contact" contact={lead.marketingContact} />
            <ContactCard title="Business Contact" contact={lead.businessContact} />
            <ContactCard title="Marketing Contact #2" contact={lead.marketingContact2} />
            <ContactCard title="Business Contact #2" contact={lead.businessContact2} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            {(lead.notes || []).length === 0 && !lead.internalNotes ? (
              <p className="text-sm text-sta-teal">No notes yet</p>
            ) : (
              <>
                {(lead.notes || []).map((note) => (
                  <div key={note.id} className="border-l-2 border-sta-cyan pl-4">
                    <p className="text-sm text-sta-navy">{note.text}</p>
                    <p className="mt-1 text-xs text-sta-teal">
                      {note.author} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Textarea
              placeholder="Add note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
              {savingNote ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            lead={lead}
            onSuccess={() => {
              setEditOpen(false);
              loadLead();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
