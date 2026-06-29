"use client";

import { useState } from "react";
import Link from "next/link";
import { Lead, PIPELINE_STAGES, PipelineStage, OWNERS } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { StageBadge } from "./StageBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateLead, updateLeadStage } from "@/lib/firestore";
import { ArrowUpDown } from "lucide-react";

type SortField = "companyName" | "level2026" | "pipelineStage" | "owner" | "amount2026" | "paidAmount" | "outstandingAmount" | "updatedAt";
type SortDir = "asc" | "desc";

interface LeadTableProps {
  leads: Lead[];
  onUpdate: () => void;
}

export function LeadTable({ leads, onUpdate }: LeadTableProps) {
  const [sortField, setSortField] = useState<SortField>("companyName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...leads].sort((a, b) => {
    let aVal: string | number = a[sortField] as string | number;
    let bVal: string | number = b[sortField] as string | number;
    if (sortField === "amount2026" || sortField === "paidAmount" || sortField === "outstandingAmount") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const getRowClass = (lead: Lead) => {
    if (lead.declined || lead.status === "Declined") return "bg-red-50 hover:bg-red-100";
    if (lead.paid) return "bg-green-50 hover:bg-green-100";
    if (lead.invoiceSent || lead.invoiceSentDate) return "bg-yellow-50 hover:bg-yellow-100";
    if (lead.isSponsor && !lead.paid) return "bg-blue-50 hover:bg-blue-100";
    return "hover:bg-[#F4F8FB]";
  };

  const handleStageChange = async (leadId: string, stage: PipelineStage) => {
    await updateLeadStage(leadId, stage);
    onUpdate();
  };

  const handleOwnerChange = async (leadId: string, owner: string) => {
    await updateLead(leadId, { owner: owner as Lead["owner"] });
    onUpdate();
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-sta-navy hover:text-sta-cyan"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  if (leads.length === 0) {
    return (
      <div className="sta-card border-dashed p-12 text-center">
        <p className="text-lg text-sta-teal">No leads yet — click Add Lead to get started</p>
        <Button asChild className="mt-4" size="lg">
          <Link href="/leads/new">+ Add Lead</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="sta-card overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr className="border-b border-[#D8E8F2] bg-[#F4F8FB] text-left">
            <th className="px-4 py-3"><SortHeader field="companyName" label="Company" /></th>
            <th className="px-4 py-3"><SortHeader field="level2026" label="Tier" /></th>
            <th className="px-4 py-3"><SortHeader field="pipelineStage" label="Stage" /></th>
            <th className="px-4 py-3"><SortHeader field="owner" label="Owner" /></th>
            <th className="px-4 py-3"><SortHeader field="amount2026" label="2026 Amount" /></th>
            <th className="px-4 py-3"><SortHeader field="paidAmount" label="Paid" /></th>
            <th className="px-4 py-3"><SortHeader field="outstandingAmount" label="Outstanding" /></th>
            <th className="px-4 py-3">Asset Buckets</th>
            <th className="px-4 py-3">Firm Type</th>
            <th className="px-4 py-3"><SortHeader field="updatedAt" label="Last Updated" /></th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr key={lead.id} className={`border-b border-slate-100 transition-colors ${getRowClass(lead)}`}>
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-semibold text-sta-navy hover:text-sta-cyan">
                  {lead.companyName}
                </Link>
              </td>
              <td className="px-4 py-3"><TierBadge tier={lead.level2026} /></td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Select value={lead.pipelineStage} onValueChange={(v) => handleStageChange(lead.id, v as PipelineStage)}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Select value={lead.owner || ""} onValueChange={(v) => handleOwnerChange(lead.id, v)}>
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3 font-medium">{formatCurrency(lead.amount2026)}</td>
              <td className="px-4 py-3">{formatCurrency(lead.paidAmount)}</td>
              <td className="px-4 py-3">{formatCurrency(lead.outstandingAmount)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {lead.assetBuckets?.map((b) => (
                    <Badge key={b} variant="secondary">{b}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-sta-teal">{lead.firmType || "—"}</td>
              <td className="px-4 py-3 text-sta-teal/70">{formatDate(lead.updatedAt)}</td>
              <td className="px-4 py-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/leads/${lead.id}`}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
