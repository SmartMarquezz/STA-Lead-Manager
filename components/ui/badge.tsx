import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "platinum" | "diamond" | "gold" | "silver" | "committed" | "hot" | "in-progress" | "declined" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-900 text-white",
    platinum: "bg-[#7C3AED] text-white",
    diamond: "bg-[#2563EB] text-white",
    gold: "bg-[#D97706] text-white",
    silver: "bg-[#6B7280] text-white",
    committed: "bg-[#16A34A] text-white",
    hot: "bg-[#DC2626] text-white",
    "in-progress": "bg-[#3B82F6] text-white",
    declined: "bg-[#EF4444] text-white",
    outline: "border border-slate-200 text-slate-700 bg-white",
    secondary: "bg-slate-100 text-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
