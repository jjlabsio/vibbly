import { google } from "googleapis";
import db from "@/lib/prisma";

export async function getYouTubeClient(userId: string) {
  const account = await db.youtubeAccount.findFirst({
    where: { userId: userId },
  });
  if (!account) throw new Error("유튜브 계정 미등록");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? Number(account.expiryDate) : null,
  });

  // access_token 자동 갱신
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await db.youtubeAccount.update({
        where: { channelId: account.channelId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date ?? null,
        },
      });
    }
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}
