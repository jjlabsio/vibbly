import { google } from "googleapis";
import db from "@/lib/prisma";
import { getOauth2Client } from "./oauth";
import { YoutubeAccount } from "@/generated/prisma";

export async function getYouTubeClient(channel: YoutubeAccount) {
  const { accessToken, refreshToken, expiryDate, channelId } = channel;

  const oauth2Client = getOauth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate ? Number(expiryDate) : null,
  });

  // access_token 자동 갱신
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await db.youtubeAccount.update({
        where: { channelId: channelId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date ?? null,
        },
      });
    }
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}
