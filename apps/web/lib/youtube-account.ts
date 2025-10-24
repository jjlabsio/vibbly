import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { getOauth2Client } from "./oauth";
import { SocialAccount } from "@/generated/prisma";

export async function getYouTubeClient(channel: SocialAccount) {
  const socialToken = await prisma.socialToken.findUnique({
    where: {
      socialAccountId: channel.id,
    },
  });

  if (!socialToken) {
    throw Error("There is no matched socialToken");
  }

  const { accessToken, refreshToken, expiryDate, socialAccountId } =
    socialToken;

  const oauth2Client = getOauth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate ? Number(expiryDate) : null,
  });

  // access_token 자동 갱신
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.socialToken.update({
        where: { socialAccountId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date ?? null,
        },
      });
    }
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}
