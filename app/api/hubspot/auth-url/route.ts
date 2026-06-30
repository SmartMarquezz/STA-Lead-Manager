import { verifyFirebaseUser } from "@/lib/server-auth";
import { getHubSpotAuthUrl } from "@/lib/hubspot-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/hubspot/callback`;
    const url = getHubSpotAuthUrl(uid, redirectUri);
    return Response.json({ url });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "HubSpot not configured" },
      { status: 503 }
    );
  }
}
