/** Server-side HubSpot token — static/private app (no OAuth redirect URLs needed). */
export function getServerHubSpotAccessToken(): string | null {
  const token =
    process.env.HUBSPOT_ACCESS_TOKEN ||
    process.env.HUBSPOT_PRIVATE_APP_TOKEN ||
    null;
  return token?.trim() || null;
}

export function isStaticHubSpotConfigured(): boolean {
  return Boolean(getServerHubSpotAccessToken());
}

export type HubSpotConnectionMode = "static" | "oauth" | "none";

export function getHubSpotConnectionMode(): HubSpotConnectionMode {
  if (isStaticHubSpotConfigured()) return "static";
  if (process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET) return "oauth";
  return "none";
}
