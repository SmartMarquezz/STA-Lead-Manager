type GenerateResult = { text: string } | { error: string; status: number };

export async function generateWithGemini(prompt: string, apiKey: string): Promise<GenerateResult> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return {
      error: `Gemini API error (${res.status}): ${detail.slice(0, 200)}`,
      status: res.status,
    };
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return { error: "Gemini returned an empty response.", status: 502 };
  }

  return { text };
}

export async function generateWithGroq(prompt: string, apiKey: string): Promise<GenerateResult> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return {
      error: `Groq API error (${res.status}): ${detail.slice(0, 200)}`,
      status: res.status,
    };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    return { error: "Groq returned an empty response.", status: 502 };
  }

  return { text };
}

export async function generateWithOpenAI(prompt: string, apiKey: string): Promise<GenerateResult> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return {
      error: `OpenAI API error (${res.status}): ${detail.slice(0, 200)}`,
      status: res.status,
    };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    return { error: "OpenAI returned an empty response.", status: 502 };
  }

  return { text };
}

export async function generateCloudSummary(prompt: string): Promise<GenerateResult> {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const tryProvider = async (name: string): Promise<GenerateResult | null> => {
    if (name === "gemini" && geminiKey) return generateWithGemini(prompt, geminiKey);
    if (name === "groq" && groqKey) return generateWithGroq(prompt, groqKey);
    if (name === "openai" && openaiKey) return generateWithOpenAI(prompt, openaiKey);
    return null;
  };

  if (provider !== "auto") {
    const result = await tryProvider(provider);
    if (!result) {
      return {
        error: `AI_PROVIDER is set to "${provider}" but no matching API key is configured.`,
        status: 503,
      };
    }
    return result;
  }

  // Prefer Groq (free, no billing card). Gemini often requires prepaid credits.
  if (groqKey) return generateWithGroq(prompt, groqKey);
  if (openaiKey) return generateWithOpenAI(prompt, openaiKey);
  if (geminiKey) return generateWithGemini(prompt, geminiKey);

  return {
    error: "No cloud AI provider configured.",
    status: 503,
  };
}
