import { getHubSpotConnectionMode, isStaticHubSpotConfigured } from "@/lib/hubspot-server-token";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = getHubSpotConnectionMode();
  return Response.json({
    mode,
    staticTokenConfigured: isStaticHubSpotConfigured(),
    oauthConfigured: Boolean(
      process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET
    ),
    ready: mode === "static" || mode === "oauth",
  });
}
