import { Badge } from "@/components/ui/badge";
import { PipelineStage, LeadStatus } from "@/lib/types";

interface StageBadgeProps {
  stage?: PipelineStage | string;
  status?: LeadStatus | string;
  className?: string;
}

export function StageBadge({ stage, status, className }: StageBadgeProps) {
  const label = stage || status || "Unknown";

  const getVariant = (): "default" | "hot" | "in-progress" | "committed" | "declined" | "secondary" => {
    if (status === "Hot") return "hot";
    if (status === "In Progress") return "in-progress";
    if (status === "Committed" || stage === "Sponsor") return "committed";
    if (status === "Declined") return "declined";
    if (stage === "Offer Sent") return "hot";
    if (stage === "Invoice Sent") return "in-progress";
    return "secondary";
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {label}
    </Badge>
  );
}
