"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getAllLeads } from "@/lib/firestore";
import { Lead } from "@/lib/types";
import { TierBadge } from "@/components/TierBadge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

const TIER_ORDER = ["Platinum", "Diamond", "Gold", "Silver", "Unknown"];

export default function SponsorsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLeads().then((data) => {
      const sponsors = data.filter((l) => l.isSponsor || l.pipelineStage === "Sponsor" || l.paid);
      sponsors.sort((a, b) => {
        const tierA = TIER_ORDER.indexOf(a.level2026 || "Unknown");
        const tierB = TIER_ORDER.indexOf(b.level2026 || "Unknown");
        if (tierA !== tierB) return tierA - tierB;
        return (b.amount2026 || 0) - (a.amount2026 || 0);
      });
      setLeads(sponsors);
      setLoading(false);
    });
  }, []);

  const totalCommitted = leads.reduce((s, l) => s + (l.amount2026 || 0), 0);
  const totalPaid = leads.reduce((s, l) => s + (l.paidAmount || 0), 0);
  const totalOutstanding = leads.reduce((s, l) => s + (l.outstandingAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="2026 Conference"
        title="Current"
        titleAccent="Sponsors"
        subtitle="Confirmed sponsors and revenue summary."
        compact
      >
        <div className="space-y-4 text-white">
          <div className="flex justify-between border-b border-white/20 pb-3">
            <span className="text-xs uppercase tracking-wider text-white/70">Total Sponsors</span>
            <span className="text-xl font-bold">{leads.length}</span>
          </div>
          <div className="flex justify-between border-b border-white/20 pb-3">
            <span className="text-xs uppercase tracking-wider text-white/70">Committed</span>
            <span className="text-xl font-bold">{formatCurrency(totalCommitted)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs uppercase tracking-wider text-white/70">Outstanding</span>
            <span className="text-xl font-bold text-sta-cyan">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Sponsors", value: leads.length },
            { label: "Revenue Committed", value: formatCurrency(totalCommitted) },
            { label: "Total Paid", value: formatCurrency(totalPaid), highlight: "text-committed" },
            { label: "Outstanding", value: formatCurrency(totalOutstanding), highlight: "text-gold" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold text-sta-navy ${stat.highlight || ""}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {leads.length === 0 ? (
          <div className="sta-card border-dashed p-12 text-center">
            <p className="text-lg text-sta-teal">No sponsors yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => {
              const hasOutstanding = (lead.outstandingAmount || 0) > 0;
              const fullyPaid = lead.paid && !hasOutstanding;
              return (
                <Link key={lead.id} href={`/leads/${lead.id}`}>
                  <Card
                    className={`transition-shadow hover:shadow-sta-lg ${
                      hasOutstanding ? "border-l-4 border-l-hot" : fullyPaid ? "border-l-4 border-l-committed" : "border-l-4 border-l-sta-cyan"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="text-lg font-bold text-sta-navy">{lead.companyName}</h3>
                        <TierBadge tier={lead.level2026} />
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-sta-teal">Paid:</span> <strong className="text-committed">{formatCurrency(lead.paidAmount)}</strong></p>
                        <p><span className="text-sta-teal">Outstanding:</span> <strong className={hasOutstanding ? "text-hot" : "text-sta-navy"}>{formatCurrency(lead.outstandingAmount)}</strong></p>
                        {lead.marketingContact?.name && (
                          <p><span className="text-sta-teal">Contact:</span> {lead.marketingContact.name}</p>
                        )}
                        <p className="text-xs text-sta-teal/70">Updated {formatDate(lead.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
