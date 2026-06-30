"use client";

import { useEffect, useState } from "react";
import { Users, Target, Award, DollarSign } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { FollowUpDashboard } from "@/components/FollowUpDashboard";
import { StatsCard } from "@/components/StatsCard";
import { AISummary } from "@/components/AISummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllLeads, getDashboardStats } from "@/lib/firestore";
import { Lead, PipelineStage, PIPELINE_STAGES } from "@/lib/types";
import { getStageColor } from "@/lib/ollama";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLeads().then((data) => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
      </div>
    );
  }

  const stats = getDashboardStats(leads);
  const maxStageCount = Math.max(...Object.values(stats.stageCounts), 1);

  const tierColors: Record<string, string> = {
    Platinum: "#7C3AED",
    Diamond: "#006CB8",
    Gold: "#D97706",
    Silver: "#6B7280",
    Unknown: "#3D8EB0",
  };

  const totalTierSponsors = Object.values(stats.tierCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHero
        eyebrow="2026 Conference"
        title="Sponsor Pipeline"
        titleAccent="Dashboard"
        subtitle="Your sponsor and lead pipeline at a glance."
        compact
      >
        <div className="space-y-4 text-white">
          <div className="flex justify-between border-b border-white/20 pb-3">
            <span className="text-xs uppercase tracking-wider text-white/70">Total Leads</span>
            <span className="text-xl font-bold">{stats.totalLeads}</span>
          </div>
          <div className="flex justify-between border-b border-white/20 pb-3">
            <span className="text-xs uppercase tracking-wider text-white/70">Sponsors</span>
            <span className="text-xl font-bold">{stats.sponsorsThisYear}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs uppercase tracking-wider text-white/70">Outstanding</span>
            <span className="text-xl font-bold text-sta-cyan">{formatCurrency(stats.outstandingRevenue)}</span>
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <FollowUpDashboard leads={leads} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Leads" value={stats.totalLeads} icon={Users} accent="sky" />
          <StatsCard title="Active Prospects" value={stats.activeProspects} icon={Target} accent="teal" />
          <StatsCard title="Sponsors This Year" value={stats.sponsorsThisYear} icon={Award} accent="navy" />
          <StatsCard title="Outstanding Revenue" value={formatCurrency(stats.outstandingRevenue)} icon={DollarSign} accent="cyan" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage) => {
                const count = stats.stageCounts[stage as PipelineStage] || 0;
                const color = getStageColor(stage as PipelineStage);
                const width = maxStageCount > 0 ? (count / maxStageCount) * 100 : 0;
                return (
                  <div key={stage} className="flex items-center gap-4">
                    <span className="w-36 shrink-0 text-sm font-medium text-sta-navy">{stage}</span>
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-7 flex-1 overflow-hidden bg-[#E8F4FA]">
                        <div
                          className="flex h-full items-center px-3 text-xs font-bold text-white transition-all"
                          style={{ width: `${Math.max(width, count > 0 ? 8 : 0)}%`, backgroundColor: color }}
                        >
                          {count > 0 && count}
                        </div>
                      </div>
                      <span className="w-8 text-right text-sm font-bold text-sta-teal">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sponsor Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex justify-center">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return Object.entries(stats.tierCounts).map(([tier, count]) => {
                        if (count === 0 || totalTierSponsors === 0) return null;
                        const pct = (count / totalTierSponsors) * 100;
                        const dashArray = `${pct} ${100 - pct}`;
                        const el = (
                          <circle
                            key={tier}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={tierColors[tier] || "#3D8EB0"}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.tierCounts).map(([tier, count]) => (
                  <div key={tier} className="flex items-center gap-2">
                    <div className="h-3 w-3" style={{ backgroundColor: tierColors[tier] }} />
                    <span className="text-sm text-sta-navy">{tier}: <strong>{count}</strong></span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#E8F4FA] pt-4 text-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">Committed</p>
                  <p className="text-lg font-bold text-sta-navy">{formatCurrency(stats.totalCommitted)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">Paid</p>
                  <p className="text-lg font-bold text-committed">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">Outstanding</p>
                  <p className="text-lg font-bold text-gold">{formatCurrency(stats.totalOutstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AISummary leads={leads} />
        </div>
      </div>
    </>
  );
}
