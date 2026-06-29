"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAISummary } from "@/lib/ollama";
import { Sparkles, RefreshCw } from "lucide-react";

interface AISummaryProps {
  leads: Lead[];
}

export function AISummary({ leads }: AISummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isLocalOnly, setIsLocalOnly] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSummary("");

    const result = await generateAISummary(leads);

    if (result.isLocalOnly) {
      setIsLocalOnly(true);
      setError(result.error || "");
    } else if (result.error) {
      setError(result.error);
    } else if (result.text) {
      setSummary(result.text);
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sta-cyan" />
          Pipeline Summary — Ollama AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button onClick={handleGenerate} disabled={loading || leads.length === 0}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
          {summary && (
            <Button variant="outline" onClick={handleGenerate} disabled={loading}>
              Regenerate
            </Button>
          )}
        </div>

        {leads.length === 0 && (
          <p className="text-sm text-sta-teal">Add leads to generate an AI summary.</p>
        )}

        {error && (
          <div className={`p-4 text-sm ${isLocalOnly ? "bg-[#E8F4FA] text-sta-navy" : "bg-red-50 text-red-700"}`}>
            {error}
          </div>
        )}

        {summary && (
          <div className="bg-[#F4F8FB] p-6">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-sta-navy">
              {summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
