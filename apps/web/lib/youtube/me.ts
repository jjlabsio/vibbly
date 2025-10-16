import { auth } from "@/auth";
import prisma from "../prisma";
import { getYouTubeClient } from "../youtube-account";
import { youtube_v3 } from "googleapis";
import { paginateList } from "./pagination";

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
      const client = await getYouTubeClient(account);
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
      const client = await getYouTubeClient(account);
      const channelList = await client.channels.list({
        part: ["contentDetails", "snippet"],
        mine: true,
      });
      const channelName = (channelList.data.items || [])[0]?.snippet
        ?.title as string;
      const uploadPlaylist = (channelList.data.items || [])[0]?.contentDetails
        ?.relatedPlaylists?.uploads as string;

      const videos = await getAllVideos(
        client,
        uploadPlaylist,
        account.channelId,
        channelName
      );

      allContents.push(...videos);
    }

    return allContents;
  } catch (error) {
    console.error("error: >>", error);
    return [];
  }
};

/**
 * 유튜브 업로드 플레이리스트의 모든 동영상 가져오기
 */
export const getAllVideos = async (
  client: youtube_v3.Youtube,
  uploadPlaylist: string,
  channelId: string,
  channelName: string
) => {
  const parseItems = (
    res: youtube_v3.Schema$PlaylistItemListResponse
  ): Content[] => {
    const items = res.items || [];

    const formatted: Content[] = items
      .filter((item) => item.status?.privacyStatus === "public")
      .map((item) => {
        const id = item.contentDetails?.videoId;
        if (!id) return null;

        return {
          id: id,
          title: item.snippet?.title!,
          description: item.snippet?.description!,
          publishedAt: item.snippet?.publishedAt!,
          accountId: channelId,
          accountName: channelName,
        };
      })
      .filter(isTruthy);

    return formatted;
  };

  const videos = await paginateList<
    youtube_v3.Params$Resource$Playlistitems$List,
    Content,
    youtube_v3.Schema$PlaylistItemListResponse
  >({
    listFn: (params) => client.playlistItems.list(params),
    initParams: {
      part: ["id", "snippet", "contentDetails", "status"],
      playlistId: uploadPlaylist,
      maxResults: 50,
    },
    parseItems,
  });

  return videos;
};
