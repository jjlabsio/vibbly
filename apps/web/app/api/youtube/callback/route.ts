import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import db from "@/lib/prisma";
import { auth } from "@/auth";
import { getOauth2Client } from "@/lib/oauth";
import { Platform } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Not Auth" }, { status: 401 });

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user)
    return NextResponse.json({ error: "User Not Found" }, { status: 404 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const oauth2Client = getOauth2Client();

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

  const socialAccount = await db.socialAccount.create({
    data: {
      platform: Platform.YOUTUBE,
      externalId: channelId,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  await db.socialToken.create({
    data: {
      socialAccount: {
        connect: {
          id: socialAccount.id,
        },
      },
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date ?? null,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
