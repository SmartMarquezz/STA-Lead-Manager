import { PipelineSummaryData } from "./ai-prompt";
import { PipelineStage } from "./types";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function nextStepForStage(stage: string): string {
  switch (stage) {
    case "New Lead":
      return "Connect on LinkedIn and assign an owner.";
    case "LinkedIn Connected":
      return "Send a personalized outreach email this week.";
    case "Reached Out":
      return "Follow up if no reply within 5 business days.";
    case "Responded":
      return "Schedule a call and confirm sponsorship tier interest.";
    case "Meeting / Call Held":
      return "Send sponsorship offer with pricing and benefits.";
    case "Offer Sent":
      return "Confirm receipt and answer open questions; push toward invoice.";
    case "Invoice Sent":
      return "Follow up on payment status and outstanding balance.";
    default:
      return "Review status and schedule next touchpoint.";
  }
}

export function generateLocalSummary(summary: PipelineSummaryData): string {
  const { totals, stageCounts, hottestLeads, revenueComparison } = summary;

  const lines: string[] = [];

  lines.push("PIPELINE OVERVIEW");
  lines.push(
    `You have ${totals.leads} total leads, ${totals.activeProspects} active prospects, and ${totals.sponsors} sponsors this year.`
  );
  lines.push(
    `Committed revenue: ${formatMoney(totals.committed)} · Paid: ${formatMoney(totals.paid)} · Outstanding: ${formatMoney(totals.outstanding)}.`
  );
  lines.push("");

  lines.push("PIPELINE BY STAGE");
  for (const [stage, count] of Object.entries(stageCounts)) {
    if (count > 0) {
      lines.push(`• ${stage}: ${count}`);
    }
  }
  lines.push("");

  const closeToSponsor = hottestLeads.length
    ? hottestLeads
    : Object.entries(summary.byStage)
        .flatMap(([stage, leads]) =>
          leads
            .filter((l) => !["New Lead", "Sponsor"].includes(stage))
            .map((l) => ({
              company: l.company,
              stage,
              amount2026: l.amount2026,
              status: "",
              owner: l.owner,
            }))
        )
        .sort((a, b) => (b.amount2026 || 0) - (a.amount2026 || 0))
        .slice(0, 8);

  if (closeToSponsor.length) {
    lines.push("CLOSEST TO SPONSORSHIP");
    for (const lead of closeToSponsor) {
      lines.push(
        `• ${lead.company} (${lead.stage}, ${formatMoney(lead.amount2026 || 0)}) — Owner: ${lead.owner || "Unassigned"}`
      );
      lines.push(`  → ${nextStepForStage(lead.stage)}`);
    }
    lines.push("");
  }

  const urgent: string[] = [];
  for (const [stage, leads] of Object.entries(summary.byStage)) {
    for (const lead of leads) {
      if ((lead.outstanding ?? 0) > 0) {
        urgent.push(
          `• ${lead.company} — ${formatMoney(lead.outstanding ?? 0)} outstanding (${stage})`
        );
      }
    }
  }

  const lateStage: PipelineStage[] = ["Offer Sent", "Invoice Sent", "Meeting / Call Held"];
  for (const stage of lateStage) {
    const count = stageCounts[stage] || 0;
    if (count > 0) {
      const stageLeads = summary.byStage[stage] || [];
      for (const lead of stageLeads.slice(0, 3)) {
        urgent.push(`• ${lead.company} — stalled at "${stage}" (${lead.owner || "no owner"})`);
      }
    }
  }

  if (urgent.length) {
    lines.push("NEEDS FOLLOW-UP");
    lines.push(...urgent.slice(0, 8));
    lines.push("");
  } else {
    lines.push("NEEDS FOLLOW-UP");
    lines.push("• No urgent items flagged — focus on moving mid-funnel leads forward.");
    lines.push("");
  }

  lines.push("REVENUE OUTLOOK");
  const delta = revenueComparison.delta;
  const deltaLabel =
    delta > 0
      ? `up ${formatMoney(delta)} vs last year`
      : delta < 0
        ? `down ${formatMoney(Math.abs(delta))} vs last year`
        : "flat vs last year";
  lines.push(
    `2026 pipeline total: ${formatMoney(revenueComparison.total2026)} (${deltaLabel}). 2025 total was ${formatMoney(revenueComparison.total2025)}.`
  );

  if (totals.outstanding > 0) {
    lines.push(
      `Collect ${formatMoney(totals.outstanding)} in outstanding invoices to improve cash position.`
    );
  }

  return lines.join("\n");
}
