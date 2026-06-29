"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "sky" | "teal" | "navy" | "cyan";
  subtitle?: string;
}

const accents = {
  sky: "bg-sta-sky text-sta-navy",
  teal: "bg-sta-teal text-white",
  navy: "bg-sta-navy text-white",
  cyan: "bg-sta-cyan text-white",
};

export function StatsCard({ title, value, icon: Icon, accent = "navy", subtitle }: StatsCardProps) {
  return (
    <div className="sta-card overflow-hidden">
      <div className="flex items-start justify-between p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-sta-teal">{title}</p>
          <p className="mt-2 text-3xl font-bold text-sta-navy">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-sta-teal">{subtitle}</p>}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center", accents[accent])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-sta-sky via-sta-teal to-sta-navy" />
    </div>
  );
}
