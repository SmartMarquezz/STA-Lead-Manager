import { buildAISummaryPrompt, PipelineSummaryData } from "@/lib/ai-prompt";
import { generateCloudSummary } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const summary = body?.summary as PipelineSummaryData | undefined;

    if (!summary?.totals) {
      return Response.json({ error: "Invalid pipeline summary payload." }, { status: 400 });
    }

    const prompt = buildAISummaryPrompt(summary);
    const result = await generateCloudSummary(prompt);

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ text: result.text });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "AI summary failed." },
      { status: 500 }
    );
  }
}
