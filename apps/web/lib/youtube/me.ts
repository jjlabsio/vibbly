import { auth } from "@/auth";
import prisma from "../prisma";
import { getYouTubeClient } from "../youtube-account";
import { youtube_v3 } from "googleapis";

export interface Channel {
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

function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

export interface Content {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  accountId: string;
  accountName: string;
}

export const getMyVideos = async (): Promise<Content[]> => {
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
    const allContents: Content[] = [];

    for (const account of dbAccounts) {
      const client = await getYouTubeClient(account.channelId);
      const channelList = await client.channels.list({
        part: ["contentDetails", "snippet"],
        mine: true,
      });
      const channelName = (channelList.data.items || [])[0]?.snippet
        ?.title as string;
      const uploadPlaylist = (channelList.data.items || [])[0]?.contentDetails
        ?.relatedPlaylists?.uploads;

      const playlistItems = await client.playlistItems.list({
        part: ["id", "snippet", "contentDetails", "status"],
        playlistId: uploadPlaylist,
        maxResults: 50,
      });

      // public, private이 함께 들어오고 필터링되므로 더 이상 동영상이 없을 때까지
      // 반복해서 모든 영상을 가져와야함
      const publicVideos = (playlistItems.data.items ?? []).filter(
        (video) => video.status?.privacyStatus === "public" && video.id
      );

      const videos = publicVideos
        .map((video) => {
          if (!video.id) return null;

          return {
            id: video.id,
            title: video.snippet?.title ?? "",
            description: video.snippet?.description ?? "",
            publishedAt: video.snippet?.publishedAt ?? "",
            accountId: account.channelId,
            accountName: channelName,
          };
        })
        .filter(isTruthy);

      allContents.push(...videos);
    }

    return allContents;
  } catch (error) {
    console.error("error: >>", error);
    return [];
  }
};
