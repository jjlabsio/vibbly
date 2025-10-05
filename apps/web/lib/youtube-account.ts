import { google } from "googleapis";
import db from "@/lib/prisma";
import { getOauth2Client } from "./oauth";

export async function getYouTubeClient(channelId: string) {
  const account = await db.youtubeAccount.findUnique({
    where: { channelId },
  });
  if (!account) {
    throw new Error(
      "channelId에 대항하는 계정이 데이터베이스에 존재하지 않습니다"
    );
  }

  const oauth2Client = getOauth2Client();

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
