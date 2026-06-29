import { Badge } from "@/components/ui/badge";
import { Tier } from "@/lib/types";

interface TierBadgeProps {
  tier?: Tier | string;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (!tier || tier === "Unknown") {
    return <Badge variant="outline" className={className}>Unknown</Badge>;
  }

  const variantMap: Record<string, "platinum" | "diamond" | "gold" | "silver"> = {
    Platinum: "platinum",
    Diamond: "diamond",
    Gold: "gold",
    Silver: "silver",
  };

  const variant = variantMap[tier] || "secondary";

  return (
    <Badge variant={variant} className={className}>
      {tier}
    </Badge>
  );
}
