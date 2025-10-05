import { NextRequest, NextResponse } from "next/server";
import { getOauth2Client } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const oauth2Client = getOauth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  return NextResponse.redirect(url);
}
