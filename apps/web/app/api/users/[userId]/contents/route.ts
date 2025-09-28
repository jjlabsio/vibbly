import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";

function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const accounts = await db.youtubeAccount.findMany({
    where: { userId },
  });

  const allContents: Array<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
  }> = [];

  for (const account of accounts) {
    const client = await getYouTubeClient(account.channelId);
    const channelList = await client.channels.list({
      part: ["contentDetails"],
      mine: true,
    });
    const uploadPlaylist = (channelList.data.items || [])[0]?.contentDetails
      ?.relatedPlaylists?.uploads;

    if (!uploadPlaylist) {
      continue;
    }

    const playlistItems = await client.playlistItems.list({
      part: ["id", "snippet", "contentDetails", "status"],
      playlistId: uploadPlaylist,
      maxResults: 50,
    });

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
        };
      })
      .filter(isTruthy);

    allContents.push(...videos);
  }

  return NextResponse.json({ data: allContents });
}
