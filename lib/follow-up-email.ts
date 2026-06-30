import { FollowUpPriority } from "./types";
import { generateWithGroq } from "./ai-providers";

export interface FollowUpEmailInput {
  contactName: string;
  contactEmail: string;
  companyName: string;
  followUpPriority: FollowUpPriority;
  owner?: string;
  amount2026?: number;
  internalNotes?: string;
}

export function buildFollowUpEmailPrompt(input: FollowUpEmailInput): string {
  const isInitial = input.followUpPriority === "Not Started";

  return `You are writing a professional sponsorship outreach email for STA (Securities Traders Association) Market Structure Conference.

Recipient: ${input.contactName} (${input.contactEmail})
Company: ${input.companyName}
Pipeline status: ${input.followUpPriority}
Account owner: ${input.owner || "STA team"}
2026 sponsorship amount (if known): ${input.amount2026 ? `$${input.amount2026.toLocaleString()}` : "not specified"}
Notes: ${input.internalNotes || "none"}

Write a ${isInitial ? "warm initial outreach" : "follow-up"} email that is:
- Professional, concise, and easy for a busy executive to read
- Specific to their status (${input.followUpPriority})
- Signed by the STA sponsorship team (no placeholder brackets)

Return ONLY valid JSON with this shape:
{
  "subject": "email subject line",
  "body": "email body as plain text with line breaks"
}`;
}

export async function generateFollowUpEmail(
  input: FollowUpEmailInput
): Promise<{ subject: string; body: string; provider: string }> {
  const prompt = buildFollowUpEmailPrompt(input);
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    const result = await generateWithGroq(prompt, groqKey);
    if ("text" in result) {
      try {
        const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, "").trim());
        if (parsed.subject && parsed.body) {
          return { subject: parsed.subject, body: parsed.body, provider: "Groq AI" };
        }
      } catch {
        const lines = result.text.split("\n");
        return {
          subject: `STA Market Structure Conference — ${input.companyName}`,
          body: result.text,
          provider: "Groq AI",
        };
      }
    }
  }

  return {
    subject: defaultSubject(input),
    body: defaultBody(input),
    provider: "Built-in template",
  };
}

function defaultSubject(input: FollowUpEmailInput): string {
  if (input.followUpPriority === "Not Started") {
    return `STA Market Structure Conference — Sponsorship opportunity for ${input.companyName}`;
  }
  return `Following up — STA Market Structure Conference & ${input.companyName}`;
}

function defaultBody(input: FollowUpEmailInput): string {
  const greeting = input.contactName ? `Hi ${input.contactName.split(" ")[0]},` : "Hello,";

  if (input.followUpPriority === "Not Started") {
    return `${greeting}

I'm reaching out from the Securities Traders Association (STA) regarding sponsorship opportunities for our upcoming Market Structure Conference.

We would love to explore how ${input.companyName} might participate this year. Would you have 15 minutes for a brief call this week?

Best regards,
STA Sponsorship Team`;
  }

  if (input.followUpPriority === "Hot") {
    return `${greeting}

Thank you for your interest in sponsoring the STA Market Structure Conference. I wanted to follow up on next steps for ${input.companyName} and answer any questions about sponsorship tiers and benefits.

Are you available for a quick call in the next few days?

Best regards,
STA Sponsorship Team`;
  }

  if (input.followUpPriority === "In Progress") {
    return `${greeting}

I wanted to check in on our conversation about ${input.companyName}'s participation in the STA Market Structure Conference. Please let me know if you need any additional information from our team.

Best regards,
STA Sponsorship Team`;
  }

  return `${greeting}

I'm following up on my previous email regarding the STA Market Structure Conference and sponsorship opportunities for ${input.companyName}. I'd appreciate the chance to connect when you have a moment.

Best regards,
STA Sponsorship Team`;
}
