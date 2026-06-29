import { Lead, PipelineStage } from "./types";
import { getDashboardStats } from "./firestore";

export function buildPipelineSummary(leads: Lead[]) {
  const stats = getDashboardStats(leads);

  const byStage: Record<string, Lead[]> = {};
  leads.forEach((lead) => {
    const stage = lead.pipelineStage || "New Lead";
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(lead);
  });

  const hottest = leads
    .filter(
      (l) =>
        (l.status === "Hot" || l.status === "In Progress") &&
        !l.declined &&
        !l.isSponsor
    )
    .sort((a, b) => (b.amount2026 || 0) - (a.amount2026 || 0))
    .slice(0, 10)
    .map((l) => ({
      company: l.companyName,
      stage: l.pipelineStage,
      amount2026: l.amount2026,
      status: l.status,
      owner: l.owner,
    }));

  return {
    totals: {
      leads: stats.totalLeads,
      activeProspects: stats.activeProspects,
      sponsors: stats.sponsorsThisYear,
      committed: stats.totalCommitted,
      paid: stats.totalPaid,
      outstanding: stats.totalOutstanding,
    },
    stageCounts: stats.stageCounts,
    byStage: Object.fromEntries(
      Object.entries(byStage).map(([stage, stageLeads]) => [
        stage,
        stageLeads.map((l) => ({
          company: l.companyName,
          owner: l.owner,
          amount2026: l.amount2026,
          outstanding: l.outstandingAmount,
        })),
      ])
    ),
    hottestLeads: hottest,
    revenueComparison: {
      total2026: leads.reduce((s, l) => s + (l.amount2026 || 0), 0),
      total2025: leads.reduce((s, l) => s + (l.amount2025 || 0), 0),
      delta: leads.reduce((s, l) => s + (l.delta2625 || 0), 0),
    },
  };
}

export type PipelineSummaryData = ReturnType<typeof buildPipelineSummary>;

export function buildAISummaryPrompt(summary: PipelineSummaryData): string {
  return `You are a sales assistant for STA, a financial industry association. Here is the current state of the sponsor and lead pipeline:

${JSON.stringify(summary, null, 2)}

Please provide:
1) A brief summary of where things stand overall.
2) Which leads are closest to becoming sponsors and what are the recommended next steps for each.
3) Which leads need urgent follow-up and why.
4) The overall revenue outlook compared to last year.

Keep your response concise, actionable, and easy to understand for a non-technical executive.`;
}

export function getStageColor(stage: PipelineStage): string {
  const colors: Record<PipelineStage, string> = {
    "New Lead": "#94A3B8",
    "LinkedIn Connected": "#7EC8E3",
    "Reached Out": "#5Aafd0",
    Responded: "#3D8EB0",
    "Meeting / Call Held": "#2A6496",
    "Offer Sent": "#006CB8",
    "Invoice Sent": "#00B4E4",
    Sponsor: "#0D2847",
  };
  return colors[stage] || "#3D8EB0";
}
