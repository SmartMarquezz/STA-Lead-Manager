import { verifyFirebaseUser } from "@/lib/server-auth";
import { exchangeHubSpotCode } from "@/lib/hubspot-api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return Response.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/hubspot/callback`;
    const tokens = await exchangeHubSpotCode(code, redirectUri);

    return Response.json({ tokens });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Exchange failed" },
      { status: 500 }
    );
  }
}
