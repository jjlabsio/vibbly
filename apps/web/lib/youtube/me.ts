import { auth } from "@/auth";
import prisma from "../prisma";
import { getYouTubeClient } from "../youtube-account";
import { youtube_v3 } from "googleapis";

interface Channel {
  id: string;
  title: string;
  description: string;
  profileUrl: string;
}

export const getMyChannels = async () => {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw Error("session.user.email 데이터가 존재하지 않습니다");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      throw Error("user가 데이터베이스에 존재하지 않습니다");
    }

    const dbAccounts = await prisma.youtubeAccount.findMany({
      where: { userId: user.id },
    });
    const accounts: Channel[] = [];

    for (const account of dbAccounts) {
      const client = await getYouTubeClient(account.channelId);
      const channels = await client.channels.list({
        part: ["id", "snippet"],
        id: [account.channelId],
      });
      const channel = channels.data.items![0] as youtube_v3.Schema$Channel;
      const channelData: Channel = {
        id: channel.id as string,
        title: channel.snippet?.title as string,
        description: channel.snippet?.description as string,
        profileUrl: channel.snippet?.thumbnails?.default?.url as string,
      };
      accounts.push(channelData);
    }

    return accounts;
  } catch (error) {
    console.error("error: >>", error);
    return null;
  }
};
