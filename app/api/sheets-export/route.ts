export const dynamic = "force-dynamic";

const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FILE_ID;

export async function GET() {
  if (!SHEET_ID) {
    return Response.json({ error: "No Google Sheets ID configured" }, { status: 404 });
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

  try {
    const res = await fetch(exportUrl, {
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "STA-Lead-Manager/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Google Sheets export failed (${res.status})` },
        { status: res.status }
      );
    }

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
