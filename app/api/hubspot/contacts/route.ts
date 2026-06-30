import { verifyFirebaseUser } from "@/lib/server-auth";
import { searchHubSpotContacts } from "@/lib/hubspot-api";
import { getServerHubSpotAccessToken } from "@/lib/hubspot-server-token";
import { getContactsFromLead, mergeHubSpotContacts } from "@/lib/follow-up";
import { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const uid = await verifyFirebaseUser(req.headers.get("Authorization"));
  if (!uid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken: clientToken, lead } = (await req.json()) as {
      accessToken?: string;
      lead?: Lead;
    };

    if (!lead?.companyName) {
      return Response.json({ error: "Missing lead" }, { status: 400 });
    }

    const accessToken = clientToken || getServerHubSpotAccessToken();
    const sheetContacts = getContactsFromLead(lead);
    let hubspotContacts: ReturnType<typeof mergeHubSpotContacts> = [];

    if (accessToken) {
      try {
        hubspotContacts = await searchHubSpotContacts(accessToken, lead.companyName);
      } catch {
        hubspotContacts = [];
      }
    }

    const contacts = mergeHubSpotContacts(sheetContacts, hubspotContacts);

    return Response.json({ contacts, hubspotUsed: Boolean(accessToken) });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Contact lookup failed" },
      { status: 500 }
    );
  }
}
