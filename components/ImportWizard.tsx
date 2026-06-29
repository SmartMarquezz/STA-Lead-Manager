"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importLeads } from "@/lib/firestore";
import { LeadInput, derivePipelineStage, inferAssetBuckets, inferTags } from "@/lib/types";
import { Upload, FileSpreadsheet } from "lucide-react";

const APP_FIELDS = [
  "companyName",
  "sponsorshipBucket",
  "status",
  "owner",
  "internalNotes",
  "level2026",
  "amount2026",
  "invoiceSentDate",
  "paidAmount",
  "outstandingAmount",
  "level2025",
  "amount2025",
  "delta2625",
  "jumpBallAmount",
  "slaSentTo",
  "invoiceSentTo",
  "marketingContactName",
  "marketingContactEmail",
  "businessContactName",
  "businessContactEmail",
  "skip",
];

const COLUMN_ALIASES: Record<string, string> = {
  "company name": "companyName",
  "company": "companyName",
  "sponsorship bucket": "sponsorshipBucket",
  "bucket": "sponsorshipBucket",
  "status": "status",
  "owner": "owner",
  "internal notes": "internalNotes",
  "notes": "internalNotes",
  "2026 level": "level2026",
  "2026 amount": "amount2026",
  "invoice sent date": "invoiceSentDate",
  "paid amount": "paidAmount",
  "paid": "paidAmount",
  "outstanding amount": "outstandingAmount",
  "outstanding": "outstandingAmount",
  "2025 level": "level2025",
  "2025 amount": "amount2025",
  "26 vs 25 delta": "delta2625",
  "delta": "delta2625",
  "jump ball amount": "jumpBallAmount",
  "jump ball": "jumpBallAmount",
  "sla sent to": "slaSentTo",
  "invoice sent to": "invoiceSentTo",
  "marketing contact name": "marketingContactName",
  "marketing contact email": "marketingContactEmail",
  "business contact name": "businessContactName",
  "business contact email": "businessContactEmail",
};

interface ImportWizardProps {
  onComplete?: () => void;
}

export function ImportWizard({ onComplete }: ImportWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseFile = useCallback(async (f: File) => {
    const buffer = await f.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (data.length === 0) return;

    const cols = Object.keys(data[0]);
    setHeaders(cols);
    setRows(data);
    setFile(f);

    const autoMapping: Record<string, string> = {};
    cols.forEach((col) => {
      const normalized = col.toLowerCase().trim();
      if (COLUMN_ALIASES[normalized]) {
        autoMapping[col] = COLUMN_ALIASES[normalized];
      } else {
        autoMapping[col] = "skip";
      }
    });
    setMapping(autoMapping);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".csv") || f.name.endsWith(".xls"))) {
        parseFile(f);
      }
    },
    [parseFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  const mapRowToLead = (row: Record<string, unknown>): Partial<LeadInput> => {
    const lead: Record<string, unknown> = {};
    Object.entries(mapping).forEach(([fileCol, appField]) => {
      if (appField !== "skip") {
        lead[appField] = row[fileCol];
      }
    });

    const paidAmount = Number(lead.paidAmount) || 0;
    const sponsorshipBucket = String(lead.sponsorshipBucket || "");
    const status = String(lead.status || "");

    const input: Partial<LeadInput> = {
      companyName: String(lead.companyName || "").trim(),
      sponsorshipBucket,
      status: status as LeadInput["status"],
      owner: String(lead.owner || "") as LeadInput["owner"],
      internalNotes: String(lead.internalNotes || ""),
      level2026: String(lead.level2026 || "") as LeadInput["level2026"],
      amount2026: Number(lead.amount2026) || 0,
      invoiceSentDate: String(lead.invoiceSentDate || ""),
      paidAmount,
      outstandingAmount: Number(lead.outstandingAmount) || 0,
      level2025: String(lead.level2025 || "") as LeadInput["level2025"],
      amount2025: Number(lead.amount2025) || 0,
      delta2625: Number(lead.delta2625) || 0,
      jumpBallAmount: Number(lead.jumpBallAmount) || 0,
      slaSentTo: String(lead.slaSentTo || ""),
      invoiceSentTo: String(lead.invoiceSentTo || ""),
      marketingContact: {
        name: String(lead.marketingContactName || ""),
        email: String(lead.marketingContactEmail || ""),
      },
      businessContact: {
        name: String(lead.businessContactName || ""),
        email: String(lead.businessContactEmail || ""),
      },
      assetBuckets: inferAssetBuckets(sponsorshipBucket),
      paid: paidAmount > 0,
      isSponsor: sponsorshipBucket === "Committed" || paidAmount > 0,
      invoiceSent: Boolean(lead.invoiceSentDate),
      reachedOut: status === "Sent email",
      responded: status === "Replied",
      meetingHeld: status === "In Progress",
      offerSent: status === "Hot",
      declined: status === "Declined",
    };

    input.tags = inferTags(input);
    input.pipelineStage = derivePipelineStage(input);

    return input;
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const leads = rows.map(mapRowToLead).filter((l) => l.companyName);
      const res = await importLeads(leads);
      setResult(res);
      onComplete?.();
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: rows.length });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className={`border-2 border-dashed transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="mb-4 h-12 w-12 text-slate-400" />
          <p className="mb-2 text-lg font-medium text-slate-700">Drag and drop your file here</p>
          <p className="mb-4 text-sm text-slate-500">Supports .csv and .xlsx files</p>
          <label>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            <Button variant="outline" asChild>
              <span>Choose File</span>
            </Button>
          </label>
          {file && (
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <FileSpreadsheet className="h-4 w-4" />
              {file.name} — {rows.length} rows detected
            </p>
          )}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-4">
                    <span className="w-1/3 truncate text-sm font-medium text-slate-700">{header}</span>
                    <Select
                      value={mapping[header] || "skip"}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [header]: v }))}
                    >
                      <SelectTrigger className="w-2/3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_FIELDS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f === "skip" ? "— Skip —" : f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview (first 5 rows)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {headers.slice(0, 6).map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      {headers.slice(0, 6).map((h) => (
                        <td key={h} className="px-2 py-2 text-slate-600">{String(row[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Button size="lg" onClick={handleImport} disabled={importing}>
            {importing ? "Importing..." : `Import ${rows.length} Leads`}
          </Button>
        </>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <p className="text-lg font-semibold text-green-800">Import Complete</p>
            <p className="mt-2 text-green-700">
              {result.imported} leads imported, {result.skipped} skipped (duplicates), {result.errors} errors
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
