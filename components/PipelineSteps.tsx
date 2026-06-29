"use client";

import { Lead, PIPELINE_STAGES, STAGE_ORDER, PipelineStage, applyStageToBooleans } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { updateLead } from "@/lib/firestore";
import { getStageColor } from "@/lib/ollama";
import { cn } from "@/lib/utils";

interface PipelineStepsProps {
  lead: Lead;
  onUpdate: () => void;
}

const QUICK_ACTIONS: { label: string; stage: PipelineStage; field?: keyof Lead }[] = [
  { label: "Mark LinkedIn Connected", stage: "LinkedIn Connected", field: "linkedinConnected" },
  { label: "Mark Reached Out", stage: "Reached Out", field: "reachedOut" },
  { label: "Mark Responded", stage: "Responded", field: "responded" },
  { label: "Mark Meeting Held", stage: "Meeting / Call Held", field: "meetingHeld" },
  { label: "Send Offer", stage: "Offer Sent", field: "offerSent" },
  { label: "Mark Invoice Sent", stage: "Invoice Sent", field: "invoiceSent" },
  { label: "Mark as Sponsor / Paid", stage: "Sponsor", field: "paid" },
];

export function PipelineSteps({ lead, onUpdate }: PipelineStepsProps) {
  const currentIndex = STAGE_ORDER[lead.pipelineStage] ?? 0;

  const handleAction = async (stage: PipelineStage) => {
    const updates = applyStageToBooleans(stage);
    if (stage === "Sponsor") {
      updates.isSponsor = true;
      updates.paid = true;
    }
    await updateLead(lead.id, { pipelineStage: stage, ...updates });
    onUpdate();
  };

  const handleDeclined = async () => {
    await updateLead(lead.id, { declined: true, status: "Declined" });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="flex items-center justify-between">
          {PIPELINE_STAGES.map((stage, index) => {
            const isComplete = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const color = getStageColor(stage);
            return (
              <div key={stage} className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    isComplete ? "text-white" : "bg-white text-slate-400"
                  )}
                  style={{
                    backgroundColor: isComplete ? color : undefined,
                    borderColor: isComplete ? color : "#CBD5E1",
                  }}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <p
                  className={cn(
                    "mt-2 hidden text-center text-xs sm:block",
                    isCurrent ? "font-semibold text-slate-900" : "text-slate-500"
                  )}
                >
                  {stage.replace(" / Call Held", "")}
                </p>
              </div>
            );
          })}
        </div>
        <div className="absolute left-0 right-0 top-5 -z-10 h-0.5 bg-slate-200" style={{ width: "100%" }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.stage}
            variant={STAGE_ORDER[lead.pipelineStage] >= STAGE_ORDER[action.stage] ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleAction(action.stage)}
            disabled={STAGE_ORDER[lead.pipelineStage] >= STAGE_ORDER[action.stage]}
          >
            {STAGE_ORDER[lead.pipelineStage] >= STAGE_ORDER[action.stage] && (
              <Check className="mr-1 h-3.5 w-3.5" />
            )}
            {action.label}
          </Button>
        ))}
        <Button variant="destructive" size="sm" onClick={handleDeclined} disabled={lead.declined}>
          Mark Declined
        </Button>
      </div>
    </div>
  );
}
