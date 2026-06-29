"use client";

import Link from "next/link";
import { Lead, getOwnerInitials, PIPELINE_STAGES } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Edit, Eye } from "lucide-react";
import { updateLeadStage } from "@/lib/firestore";

interface LeadCardProps {
  lead: Lead;
  onUpdate?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, lead: Lead) => void;
}

export function LeadCard({ lead, onUpdate, draggable, onDragStart }: LeadCardProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(lead.pipelineStage);
  const nextStage = currentIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[currentIndex + 1] : null;

  const handleMoveNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!nextStage) return;
    await updateLeadStage(lead.id, nextStage);
    onUpdate?.();
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, lead)}
      className="cursor-grab border border-[#D8E8F2] bg-white p-4 shadow-sm transition-shadow hover:shadow-sta active:cursor-grabbing"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link href={`/leads/${lead.id}`} className="text-base font-bold text-sta-navy hover:text-sta-cyan">
          {lead.companyName}
        </Link>
        {lead.outstandingAmount && lead.outstandingAmount > 0 && (
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" title="Outstanding balance" />
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {lead.level2026 && <TierBadge tier={lead.level2026} />}
        <Badge variant="outline" className="font-semibold">
          {getOwnerInitials(lead.owner)}
        </Badge>
        {lead.assetBuckets?.map((b) => (
          <Badge key={b} variant="secondary">{b}</Badge>
        ))}
      </div>

      {lead.amount2026 ? (
        <p className="mb-3 text-sm font-semibold text-sta-navy">{formatCurrency(lead.amount2026)}</p>
      ) : null}

      <div className="flex items-center gap-1 border-t border-[#E8F4FA] pt-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/leads/${lead.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/leads/${lead.id}?edit=true`}>
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        {nextStage && (
          <Button variant="ghost" size="sm" onClick={handleMoveNext} title={`Move to ${nextStage}`}>
            <ArrowRight className="mr-1 h-3.5 w-3.5" />
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
