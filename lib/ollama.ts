import { Lead } from "./types";
import {
  buildPipelineSummary,
  buildAISummaryPrompt,
  getStageColor,
} from "./ai-prompt";

export { buildPipelineSummary, buildAISummaryPrompt, getStageColor };

/** @deprecated Use buildAISummaryPrompt */
export const buildOllamaPrompt = buildAISummaryPrompt;

async function generateWithOllama(prompt: string): Promise<{ text?: string; error?: string }> {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "llama3",
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    return { text: data.response || "No response generated." };
  } catch {
    return {
      error:
        "Ollama is not running locally. Start it with 'ollama serve', or configure GEMINI_API_KEY on Vercel.",
    };
  }
}

async function generateWithCloudApi(
  summary: ReturnType<typeof buildPipelineSummary>
): Promise<{ text?: string; error?: string }> {
  const res = await fetch("/api/ai-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error || `AI request failed (${res.status})` };
  }

  return { text: data.text };
}

export async function generateAISummary(leads: Lead[]): Promise<{
  text?: string;
  error?: string;
  provider?: string;
}> {
  if (typeof window === "undefined") {
    return { error: "AI summary must be generated from the client." };
  }

  const summary = buildPipelineSummary(leads);
  const prompt = buildAISummaryPrompt(summary);
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    const ollamaResult = await generateWithOllama(prompt);
    if (ollamaResult.text) {
      return { ...ollamaResult, provider: "Ollama (local)" };
    }
  }

  const cloudResult = await generateWithCloudApi(summary);
  if (cloudResult.text) {
    return { ...cloudResult, provider: "Cloud AI" };
  }

  if (isLocalhost) {
    return {
      error:
        cloudResult.error ||
        "No AI available. Run 'ollama serve' locally, or add GEMINI_API_KEY to .env.local.",
    };
  }

  return {
    error:
      cloudResult.error ||
      "AI summary is not configured. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.",
  };
}
