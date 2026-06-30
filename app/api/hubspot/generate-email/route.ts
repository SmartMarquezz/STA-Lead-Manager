import { verifyFirebaseUser } from "@/lib/server-auth";
import { generateFollowUpEmail, FollowUpEmailInput } from "@/lib/follow-up-email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = (await req.json()) as FollowUpEmailInput;
    if (!input.contactEmail || !input.companyName || !input.followUpPriority) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await generateFollowUpEmail(input);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Email generation failed" },
      { status: 500 }
    );
  }
}
