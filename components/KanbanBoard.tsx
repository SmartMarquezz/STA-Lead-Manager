"use client";

import { useState } from "react";
import { Lead, PIPELINE_STAGES, PipelineStage } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { updateLeadStage } from "@/lib/firestore";
import { getStageColor } from "@/lib/ollama";

interface KanbanBoardProps {
  leads: Lead[];
  onUpdate: () => void;
}

export function KanbanBoard({ leads, onUpdate }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const getLeadsForStage = (stage: PipelineStage) =>
    leads.filter((l) => l.pipelineStage === stage);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLead && draggedLead.pipelineStage !== stage) {
      await updateLeadStage(draggedLead.id, stage);
      onUpdate();
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = getLeadsForStage(stage);
        const color = getStageColor(stage);
        return (
          <div
            key={stage}
            className="min-w-[280px] flex-shrink-0"
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={() => setDragOverStage(null)}
          >
            <div
              className="mb-3 flex items-center justify-between px-3 py-2"
              style={{ backgroundColor: `${color}18`, borderLeft: `3px solid ${color}` }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-sta-navy">{stage}</h3>
              <span
                className="px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {stageLeads.length}
              </span>
            </div>
            <div
              className={`min-h-[200px] space-y-3 p-2 transition-colors ${
                dragOverStage === stage ? "bg-[#E8F4FA] ring-2 ring-sta-cyan" : "bg-[#F4F8FB]"
              }`}
            >
              {stageLeads.length === 0 ? (
                <p className="py-8 text-center text-sm text-sta-teal/60">No leads</p>
              ) : (
                stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdate={onUpdate}
                    draggable
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
