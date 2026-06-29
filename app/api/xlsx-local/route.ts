import fs from "fs";
import path from "path";

const XLSX_PATH = path.join(process.cwd(), "STA-Sponsors.xlsx");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({
      exists: false,
      production: true,
      message: "Local file sync is dev-only. Use Google Drive or upload in Settings.",
    });
  }

  if (!fs.existsSync(XLSX_PATH)) {
    return Response.json({ exists: false });
  }

  const stat = fs.statSync(XLSX_PATH);
  const url = new URL(request.url);

  if (url.searchParams.get("download") === "1") {
    const buffer = fs.readFileSync(XLSX_PATH);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": String(stat.size),
        "Last-Modified": stat.mtime.toUTCString(),
      },
    });
  }

  return Response.json({
    exists: true,
    modified: stat.mtime.toISOString(),
    size: stat.size,
    path: "STA-Sponsors.xlsx",
  });
}
