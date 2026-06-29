"use client";

import { useRef, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useSync } from "@/components/SyncProvider";
import { uploadAndSync } from "@/lib/xlsx-sync";
import { formatDate } from "@/lib/utils";
import { RefreshCw, Upload, FileSpreadsheet, Cloud } from "lucide-react";

export default function SettingsPage() {
  const { user, isDemo } = useAuth();
  const { syncing, syncState, dataSource, lastMessage, syncNow, refreshStatus } = useSync();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMessage("");
    const result = await uploadAndSync(file);
    setUploadMessage(result.message);
    await refreshStatus();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sourceLabels: Record<string, string> = {
    sheets: "Google Sheets",
    local: "Local file (dev)",
    upload: "Manual upload",
    none: "—",
  };
  const sourceLabel = syncState?.source ? sourceLabels[syncState.source] || "—" : "—";

  return (
    <>
      <PageHero
        eyebrow="Configuration"
        title="App"
        titleAccent="Settings"
        subtitle="Manage spreadsheet sync and your account."
        compact
      />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-sta-cyan" />
              Spreadsheet Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-sta-teal">
              <strong className="text-sta-navy">STA-Sponsors.xlsx</strong> feeds the app. When the Excel file
              is updated, the UI syncs automatically — no Firebase Storage required.
            </p>

            <div className="space-y-3 border border-[#D8E8F2] bg-[#F4F8FB] p-4 text-sm">
              <p className="font-bold uppercase tracking-wider text-sta-navy">Free sync options</p>
              <div className="flex items-start gap-2">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-sta-cyan" />
                <div>
                  <p className="font-medium text-sta-navy">Google Sheets (recommended)</p>
                  <p className="text-sta-teal">
                    Connect your live Google Sheet. Share as &quot;Anyone with the link&quot; and set{" "}
                    <code className="rounded bg-white px-1">NEXT_PUBLIC_GOOGLE_SHEETS_ID</code> in{" "}
                    <code className="rounded bg-white px-1">.env.local</code>.
                  </p>
                  <p className="mt-1 text-sta-teal">
                    Status: {dataSource?.sheets ? "Connected" : "Not configured"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-sta-cyan" />
                <div>
                  <p className="font-medium text-sta-navy">Local file (development only)</p>
                  <p className="text-sta-teal">
                    Place <code className="rounded bg-white px-1">STA-Sponsors.xlsx</code> in the project root.
                    Auto-syncs when you run <code className="rounded bg-white px-1">npm run dev</code>.
                  </p>
                  <p className="mt-1 text-sta-teal">
                    Status: {dataSource?.local ? "File found" : "Not found locally"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-[#F4F8FB] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-sta-teal">Last sync source</span>
                <span className="font-medium text-sta-navy">{sourceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sta-teal">Last spreadsheet sync</span>
                <span className="font-medium text-sta-navy">
                  {syncState?.lastXlsxUpdated ? formatDate(syncState.lastXlsxUpdated) : "—"}
                </span>
              </div>
              {syncState?.rowCount ? (
                <div className="flex justify-between">
                  <span className="text-sta-teal">Rows synced</span>
                  <span className="font-medium text-sta-navy">{syncState.rowCount}</span>
                </div>
              ) : null}
            </div>

            {lastMessage && <p className="text-sm text-sta-navy">{lastMessage}</p>}
            {uploadMessage && <p className="text-sm font-medium text-sta-cyan">{uploadMessage}</p>}

            <div className="flex flex-wrap gap-3">
              <label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isDemo || uploading}
                />
                <Button asChild disabled={isDemo || uploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Syncing..." : "Upload & Sync Spreadsheet"}
                  </span>
                </Button>
              </label>
              <Button variant="outline" disabled={isDemo || syncing} onClick={() => syncNow(true)}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
            </div>

            {isDemo && (
              <p className="text-sm text-gold">Exit demo mode and sign in to use live spreadsheet sync.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-bold uppercase tracking-wider text-sta-teal">Name:</span> <span className="text-sta-navy">{user?.displayName || "—"}</span></p>
            <p><span className="font-bold uppercase tracking-wider text-sta-teal">Email:</span> <span className="text-sta-navy">{user?.email || "—"}</span></p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
