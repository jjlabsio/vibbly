import { NextResponse } from "next/server";
import { google } from "googleapis";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) return NextResponse.json({ error: "Not Auth" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // 유튜브 채널 ID 가져오기
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const channel = await youtube.channels.list({
    mine: true,
    part: ["id"],
  });

  const channelId = channel.data.items?.[0]?.id;
  if (!channelId || !tokens.refresh_token)
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

  // DB 저장
  await db.youtubeAccount.create({
    data: {
      channelId: channelId,
      userId: userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date ?? null,
    },
  });

  const baseUrl = process.env.SERVICE_BASE_URL;
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
