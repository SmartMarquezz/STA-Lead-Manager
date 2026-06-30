import { refreshHubSpotToken } from "@/lib/hubspot-api";
import { verifyFirebaseUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) {
      return Response.json({ error: "Missing refresh token" }, { status: 400 });
    }

    const tokens = await refreshHubSpotToken(refreshToken);
    return Response.json({ tokens });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Refresh failed" },
      { status: 500 }
    );
  }
}
