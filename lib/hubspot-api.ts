import { Contact } from "./types";
import { HubSpotConnection } from "./hubspot-client";

type HubSpotTokens = HubSpotConnection;

const HUBSPOT_API = "https://api.hubapi.com";

export function getHubSpotAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) throw new Error("HUBSPOT_CLIENT_ID not configured");

  const scopes = [
    "oauth",
    "crm.objects.contacts.read",
    "crm.objects.contacts.write",
    "crm.objects.companies.read",
    "sales-email-read",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeHubSpotCode(
  code: string,
  redirectUri: string
): Promise<HubSpotTokens> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("HubSpot OAuth not configured");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${HUBSPOT_API}/oauth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HubSpot token exchange failed: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    hubId: data.hub_id ? String(data.hub_id) : undefined,
    connectedAt: new Date().toISOString(),
  };
}

export async function refreshHubSpotToken(refreshToken: string): Promise<HubSpotTokens> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("HubSpot OAuth not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${HUBSPOT_API}/oauth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("HubSpot token refresh failed");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    connectedAt: new Date().toISOString(),
  };
}

export async function getValidAccessToken(
  tokens: HubSpotTokens,
  onRefresh: (updated: HubSpotTokens) => Promise<void>
): Promise<string> {
  if (tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken;
  }

  const refreshed = await refreshHubSpotToken(tokens.refreshToken);
  await onRefresh({ ...tokens, ...refreshed });
  return refreshed.accessToken;
}

export async function searchHubSpotContacts(
  accessToken: string,
  companyName: string
): Promise<Contact[]> {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "company",
              operator: "CONTAINS_TOKEN",
              value: companyName.split(" ")[0] || companyName,
            },
          ],
        },
      ],
      properties: ["firstname", "lastname", "email", "jobtitle", "company"],
      limit: 20,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HubSpot contact search failed: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const contacts: Contact[] = [];

  for (const row of data.results || []) {
    const props = row.properties || {};
    const email = props.email?.trim();
    if (!email) continue;
    contacts.push({
      name: [props.firstname, props.lastname].filter(Boolean).join(" ") || email.split("@")[0],
      email,
      title: props.jobtitle || undefined,
      source: "hubspot",
    });
  }

  return contacts;
}

export async function sendHubSpotEmail(
  accessToken: string,
  contactEmail: string,
  contactId: string | null,
  subject: string,
  body: string,
  fromEmail?: string
): Promise<{ success: boolean; message: string }> {
  const metadata = {
    from: { email: fromEmail || process.env.HUBSPOT_FROM_EMAIL || "sponsorship@sta.org" },
    to: [{ email: contactEmail }],
    subject,
    html: body.replace(/\n/g, "<br>"),
    text: body,
  };

  const engagementBody = {
    engagement: { active: true, type: "EMAIL", timestamp: Date.now() },
    associations: contactId ? { contactIds: [Number(contactId)] } : {},
    metadata,
  };

  const res = await fetch(`${HUBSPOT_API}/engagements/v1/engagements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(engagementBody),
  });

  if (res.ok) {
    return {
      success: true,
      message: "Email sent and logged in HubSpot.",
    };
  }

  const detail = await res.text();

  if (process.env.HUBSPOT_MARKETING_EMAIL_ID) {
    const sendRes = await fetch(`${HUBSPOT_API}/marketing/v4/email/single-send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailId: Number(process.env.HUBSPOT_MARKETING_EMAIL_ID),
        message: {
          to: contactEmail,
          sendId: `sta-${Date.now()}`,
          _from: fromEmail || process.env.HUBSPOT_FROM_EMAIL,
        },
        contactProperties: {},
        customProperties: {
          subject,
          body,
        },
      }),
    });

    if (sendRes.ok) {
      return { success: true, message: "Email sent via HubSpot." };
    }
  }

  throw new Error(`HubSpot send failed: ${detail.slice(0, 300)}`);
}
