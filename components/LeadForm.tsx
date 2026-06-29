"use client";

import { useState } from "react";
import { Lead, PIPELINE_STAGES, TIERS, OWNERS, FIRM_TYPES, ASSET_BUCKETS, PipelineStage, Tier, Owner, FirmType, AssetBucket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLead, updateLead } from "@/lib/firestore";

interface LeadFormProps {
  lead?: Lead;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

export function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState(lead?.companyName || "");
  const [website, setWebsite] = useState(lead?.website || "");
  const [firmType, setFirmType] = useState<FirmType>(lead?.firmType || "");
  const [assetBuckets, setAssetBuckets] = useState<AssetBucket[]>(lead?.assetBuckets || []);
  const [owner, setOwner] = useState<Owner>(lead?.owner || "Jim");
  const [level2026, setLevel2026] = useState<Tier>(lead?.level2026 || "Unknown");
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>(lead?.pipelineStage || "New Lead");
  const [marketingName, setMarketingName] = useState(lead?.marketingContact?.name || "");
  const [marketingEmail, setMarketingEmail] = useState(lead?.marketingContact?.email || "");
  const [businessName, setBusinessName] = useState(lead?.businessContact?.name || "");
  const [businessEmail, setBusinessEmail] = useState(lead?.businessContact?.email || "");
  const [notes, setNotes] = useState(lead?.internalNotes || "");
  const [tags, setTags] = useState(lead?.tags?.join(", ") || "");
  const [amount2026, setAmount2026] = useState(String(lead?.amount2026 || ""));

  const toggleBucket = (bucket: AssetBucket) => {
    setAssetBuckets((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setLoading(true);
    setError("");

    const data = {
      companyName: companyName.trim(),
      website,
      firmType,
      assetBuckets,
      owner,
      level2026,
      pipelineStage,
      amount2026: Number(amount2026) || 0,
      marketingContact: { name: marketingName, email: marketingEmail },
      businessContact: { name: businessName, email: businessEmail },
      internalNotes: notes,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (lead) {
        await updateLead(lead.id, data);
        onSuccess?.(lead.id);
      } else {
        const id = await createLead(data);
        onSuccess?.(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label>Firm Type</Label>
          <Select value={firmType} onValueChange={(v) => setFirmType(v as FirmType)}>
            <SelectTrigger><SelectValue placeholder="Select firm type" /></SelectTrigger>
            <SelectContent>
              {FIRM_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Owner</Label>
          <Select value={owner} onValueChange={(v) => setOwner(v as Owner)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OWNERS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sponsorship Tier</Label>
          <Select value={level2026} onValueChange={(v) => setLevel2026(v as Tier)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pipeline Stage</Label>
          <Select value={pipelineStage} onValueChange={(v) => setPipelineStage(v as PipelineStage)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount2026">2026 Amount</Label>
          <Input id="amount2026" type="number" value={amount2026} onChange={(e) => setAmount2026(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Asset Buckets</Label>
        <div className="flex gap-4">
          {ASSET_BUCKETS.map((bucket) => (
            <label key={bucket} className="flex items-center gap-2">
              <Checkbox checked={assetBuckets.includes(bucket)} onCheckedChange={() => toggleBucket(bucket)} />
              <span className="text-sm">{bucket}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marketingName">Marketing Contact Name</Label>
          <Input id="marketingName" value={marketingName} onChange={(e) => setMarketingName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marketingEmail">Marketing Contact Email</Label>
          <Input id="marketingEmail" type="email" value={marketingEmail} onChange={(e) => setMarketingEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Contact Name</Label>
          <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessEmail">Business Contact Email</Label>
          <Input id="businessEmail" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Step Up, Hot" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
