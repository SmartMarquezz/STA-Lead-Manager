import { buildAISummaryPrompt, PipelineSummaryData } from "@/lib/ai-prompt";
import { generateCloudSummary } from "@/lib/ai-providers";
import { generateLocalSummary } from "@/lib/local-summary";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function builtInResponse(summary: PipelineSummaryData) {
  return Response.json({
    text: generateLocalSummary(summary),
    provider: "Built-in (free)",
  });
}

export async function POST(req: Request) {
  let summary: PipelineSummaryData | undefined;

  try {
    const body = await req.json();
    summary = body?.summary as PipelineSummaryData | undefined;

    if (!summary?.totals) {
      return Response.json({ error: "Invalid pipeline summary payload." }, { status: 400 });
    }

    const hasCloudKey = !!(
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY
    );

    if (hasCloudKey) {
      const prompt = buildAISummaryPrompt(summary);
      const result = await generateCloudSummary(prompt);

      if ("text" in result) {
        const provider =
          process.env.AI_PROVIDER === "groq" ||
          (!process.env.AI_PROVIDER && process.env.GROQ_API_KEY)
            ? "Groq AI"
            : process.env.AI_PROVIDER === "gemini" ||
                (!process.env.AI_PROVIDER && process.env.GEMINI_API_KEY)
              ? "Gemini AI"
              : "Cloud AI";
        return Response.json({ text: result.text, provider });
      }
    }

    return builtInResponse(summary);
  } catch {
    if (summary?.totals) {
      return builtInResponse(summary);
    }
    return Response.json({ error: "AI summary failed." }, { status: 500 });
  }
}
