import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  const redirectBase = new URL("/", req.url).origin;

  if (error) {
    return NextResponse.redirect(`${redirectBase}/?hubspot=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${redirectBase}/?hubspot=error&message=missing_code`);
  }

  return NextResponse.redirect(`${redirectBase}/?hubspot=callback&code=${encodeURIComponent(code)}`);
}
