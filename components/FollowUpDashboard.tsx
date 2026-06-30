"use client";

import { useMemo, useState } from "react";
import { Lead, FollowUpPriority, FOLLOW_UP_PRIORITIES } from "@/lib/types";
import {
  FOLLOW_UP_CONFIG,
  groupLeadsByFollowUp,
  isFollowUpLead,
} from "@/lib/follow-up";
import { FollowUpEmailModal } from "@/components/FollowUpEmailModal";
import { HubSpotConnect } from "@/components/HubSpotConnect";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Send, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface FollowUpDashboardProps {
  leads: Lead[];
}

export function FollowUpDashboard({ leads }: FollowUpDashboardProps) {
  const [expanded, setExpanded] = useState<Record<FollowUpPriority, boolean>>({
    "Not Started": true,
    Hot: true,
    "In Progress": true,
    "Sent Email": true,
  });
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const groups = useMemo(() => groupLeadsByFollowUp(leads), [leads]);
  const totalFollowUp = useMemo(
    () => leads.filter(isFollowUpLead).length,
    [leads]
  );

  const toggle = (key: FollowUpPriority) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border-2 border-sta-cyan bg-white shadow-sm">
        <div className="sta-hero rounded-t-lg px-6 py-5">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75">
                Priority Action Center
              </p>
              <h2 className="mt-1 text-2xl font-bold uppercase text-white md:text-3xl">
                Who Needs Follow Up
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/85">
                {totalFollowUp} firms need attention — sorted by STATUS from your spreadsheet.
                <strong className="text-white"> Not Started</strong> is highest priority (no outreach yet).
              </p>
            </div>
            <div className="rounded bg-white/10 px-4 py-3 text-center backdrop-blur">
              <p className="text-3xl font-bold text-white">{totalFollowUp}</p>
              <p className="text-xs uppercase tracking-wider text-white/75">Need follow-up</p>
            </div>
          </div>
        </div>

        <div className="border-b border-[#D8E8F2] bg-[#F4F8FB] px-6 py-3">
          <HubSpotConnect compact />
        </div>

        <div className="divide-y divide-[#E8F4FA]">
          {FOLLOW_UP_PRIORITIES.map((priority) => {
            const config = FOLLOW_UP_CONFIG[priority];
            const items = groups[priority];
            const isOpen = expanded[priority];
            const isTop = priority === "Not Started";

            return (
              <div key={priority} className={isTop ? "bg-[#FFFDFD]" : ""}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-[#F4F8FB]"
                  onClick={() => toggle(priority)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {items.length}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-sta-navy">{config.label}</h3>
                        {isTop && (
                          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold uppercase text-red-700">
                            Highest priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-sta-teal">{config.description}</p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-sta-teal" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-sta-teal" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-6">
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-sm text-sta-teal">
                        No firms in this bucket — you&apos;re caught up here.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded border border-[#D8E8F2]">
                        <table className="w-full text-sm">
                          <thead className="bg-[#E8F4FA] text-left text-xs font-bold uppercase tracking-wider text-sta-navy">
                            <tr>
                              <th className="px-4 py-3">Company</th>
                              <th className="hidden px-4 py-3 sm:table-cell">Owner</th>
                              <th className="hidden px-4 py-3 md:table-cell">2026 Amount</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8F4FA] bg-white">
                            {items.map((lead) => (
                              <tr key={lead.id} className="hover:bg-[#FAFCFE]">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-sta-navy">{lead.companyName}</p>
                                  {lead.internalNotes && (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-sta-teal">
                                      {lead.internalNotes}
                                    </p>
                                  )}
                                </td>
                                <td className="hidden px-4 py-3 text-sta-teal sm:table-cell">
                                  {lead.owner || "—"}
                                </td>
                                <td className="hidden px-4 py-3 font-medium text-sta-navy md:table-cell">
                                  {lead.amount2026 ? formatCurrency(lead.amount2026) : "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    size="sm"
                                    className="sta-btn-primary h-9"
                                    onClick={() => setActiveLead(lead)}
                                  >
                                    <Send className="mr-1.5 h-3.5 w-3.5" />
                                    Send Follow Up
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {totalFollowUp === 0 && (
        <div className="flex items-center gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            No follow-up leads found. Re-sync your spreadsheet in Settings — make sure STATUS
            includes Hot, In Progress, Sent Email, or Not Started, and that the &quot;Not
            Started&quot; sheet is present.
          </p>
        </div>
      )}

      <HubSpotConnect />

      <FollowUpEmailModal
        lead={activeLead}
        open={Boolean(activeLead)}
        onClose={() => setActiveLead(null)}
      />
    </section>
  );
}
