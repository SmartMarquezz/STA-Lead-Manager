"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Upload, Search } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LeadTable } from "@/components/LeadTable";
import { getAllLeads } from "@/lib/firestore";
import { Lead, PIPELINE_STAGES, TIERS, OWNERS, ASSET_BUCKETS, FIRM_TYPES } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [bucketFilter, setBucketFilter] = useState<string>("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [paidFilter, setPaidFilter] = useState<string>("");
  const [declinedFilter, setDeclinedFilter] = useState(false);

  const loadLeads = () => {
    setLoading(true);
    getAllLeads().then((data) => {
      setLeads(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          lead.companyName.toLowerCase().includes(q) ||
          lead.marketingContact?.name?.toLowerCase().includes(q) ||
          lead.marketingContact?.email?.toLowerCase().includes(q) ||
          lead.businessContact?.name?.toLowerCase().includes(q) ||
          lead.businessContact?.email?.toLowerCase().includes(q) ||
          lead.internalNotes?.toLowerCase().includes(q) ||
          lead.notes?.some((n) => n.text.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (stageFilter && lead.pipelineStage !== stageFilter) return false;
      if (ownerFilter && lead.owner !== ownerFilter) return false;
      if (tierFilter && lead.level2026 !== tierFilter) return false;
      if (bucketFilter && !lead.assetBuckets?.includes(bucketFilter as "Equity" | "Options" | "ETF")) return false;
      if (firmFilter && lead.firmType !== firmFilter) return false;
      if (paidFilter === "paid" && !lead.paid) return false;
      if (paidFilter === "unpaid" && lead.paid) return false;
      if (declinedFilter && !lead.declined && lead.status !== "Declined") return false;
      return true;
    });
  }, [leads, search, stageFilter, ownerFilter, tierFilter, bucketFilter, firmFilter, paidFilter, declinedFilter]);

  const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active ? "bg-sta-navy text-white" : "bg-[#E8F4FA] text-sta-navy hover:bg-[#D8E8F2]"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Pipeline Management"
        title="All"
        titleAccent="Leads"
        subtitle={`${filtered.length} of ${leads.length} leads in your pipeline.`}
        compact
      >
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" asChild>
            <Link href="/leads/new">
              <Plus className="mr-2 h-5 w-5" />
              Add Lead
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" className="w-full" asChild>
            <Link href="/import">
              <Upload className="mr-2 h-5 w-5" />
              Import File
            </Link>
          </Button>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search company, contacts, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="mr-2 self-center text-xs font-bold uppercase tracking-wider text-sta-teal">Stage:</span>
        <FilterPill label="All" active={!stageFilter} onClick={() => setStageFilter("")} />
        {PIPELINE_STAGES.map((s) => (
          <FilterPill key={s} label={s.split(" ")[0]} active={stageFilter === s} onClick={() => setStageFilter(stageFilter === s ? "" : s)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="mr-2 self-center text-xs font-bold uppercase tracking-wider text-sta-teal">Owner:</span>
        <FilterPill label="All" active={!ownerFilter} onClick={() => setOwnerFilter("")} />
        {OWNERS.map((o) => (
          <FilterPill key={o} label={o} active={ownerFilter === o} onClick={() => setOwnerFilter(ownerFilter === o ? "" : o)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="mr-2 self-center text-xs font-bold uppercase tracking-wider text-sta-teal">Tier:</span>
        <FilterPill label="All" active={!tierFilter} onClick={() => setTierFilter("")} />
        {TIERS.filter((t) => t !== "Unknown").map((t) => (
          <FilterPill key={t} label={t} active={tierFilter === t} onClick={() => setTierFilter(tierFilter === t ? "" : t)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill label="Paid" active={paidFilter === "paid"} onClick={() => setPaidFilter(paidFilter === "paid" ? "" : "paid")} />
        <FilterPill label="Not Paid" active={paidFilter === "unpaid"} onClick={() => setPaidFilter(paidFilter === "unpaid" ? "" : "unpaid")} />
        <FilterPill label="Declined" active={declinedFilter} onClick={() => setDeclinedFilter(!declinedFilter)} />
        {ASSET_BUCKETS.map((b) => (
          <FilterPill key={b} label={b} active={bucketFilter === b} onClick={() => setBucketFilter(bucketFilter === b ? "" : b)} />
        ))}
        {FIRM_TYPES.map((f) => (
          <FilterPill key={f} label={f} active={firmFilter === f} onClick={() => setFirmFilter(firmFilter === f ? "" : f)} />
        ))}
        {(stageFilter || ownerFilter || tierFilter || bucketFilter || firmFilter || paidFilter || declinedFilter) && (
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setStageFilter("");
              setOwnerFilter("");
              setTierFilter("");
              setBucketFilter("");
              setFirmFilter("");
              setPaidFilter("");
              setDeclinedFilter(false);
            }}
          >
            Clear all filters ×
          </Badge>
        )}
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          {filtered.length === 0 ? (
            <div className="sta-card border-dashed p-12 text-center">
              <p className="text-lg text-sta-teal">No leads match your filters</p>
              <Button asChild className="mt-4" size="lg">
                <Link href="/leads/new">+ Add Lead</Link>
              </Button>
            </div>
          ) : (
            <KanbanBoard leads={filtered} onUpdate={loadLeads} />
          )}
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <LeadTable leads={filtered} onUpdate={loadLeads} />
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
