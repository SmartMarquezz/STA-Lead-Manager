import { verifyFirebaseUser } from "@/lib/server-auth";
import { sendHubSpotEmail } from "@/lib/hubspot-api";
import { getServerHubSpotAccessToken } from "@/lib/hubspot-server-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken: clientToken, contactEmail, contactId, subject, body } =
      await req.json();

    const accessToken = clientToken || getServerHubSpotAccessToken();

    if (!accessToken || !contactEmail || !subject || !body) {
      return Response.json(
        { error: "Missing HubSpot token, contact, or email content" },
        { status: 400 }
      );
    }

    const result = await sendHubSpotEmail(
      accessToken,
      contactEmail,
      contactId || null,
      subject,
      body
    );

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
