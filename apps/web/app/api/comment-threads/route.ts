import { getYouTubeClient } from "@/lib/youtube-account";
import { youtube_v3 } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export interface Channels {
  id: string;
  videos: string[];
}

export interface CommentBase {
  id: string;
  channelId: string;
  videoId: string;
  authorDisplayName: string;
  textDisplay: string;
  textOriginal: string;
  publishedAt: string;
}

export interface Comment extends CommentBase {
  replies?: Comment[];
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const channelsParams = searchParams.get("channels");

  if (!channelsParams) {
    return Response.json(
      { error: "Channels parameter is required" },
      { status: 400 }
    );
  }

  const channels = JSON.parse(channelsParams) as Channels[];
  const promiseList: Promise<Comment[]>[] = [];

  for (const channel of channels) {
    const newPromise = async () => {
      const client = await getYouTubeClient(channel.id);
      const channelComments: Comment[] = [];

      for (const video of channel.videos) {
        const comments = await getAllComments(client, video);
        channelComments.push(...comments);
      }

      return channelComments;
    };

    promiseList.push(newPromise());
  }

  const allComments = (await Promise.all(promiseList)).flat();

  return NextResponse.json(allComments);
}

async function getAllComments(client: youtube_v3.Youtube, videoId: string) {
  let allComments: Comment[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const params: youtube_v3.Params$Resource$Commentthreads$List = {
      part: ["snippet", "replies"],
      videoId: videoId,
      maxResults: 100,
      order: "time", // relevance = 인기댓글순. time = 최신순
      pageToken: nextPageToken,
    };
    const response = await client.commentThreads.list(params);

    const items = response.data.items || [];

    const formatted: Comment[] = items.flatMap((item) => {
      const topLevelComment = item.snippet?.topLevelComment; // comment resource
      const replies = item.replies?.comments; // (comment resource)[]

      if (!topLevelComment) return [];

      const base = formatComment(topLevelComment, videoId);

      if (replies) {
        const formattedReplies = replies.map((reply) =>
          formatComment(reply, videoId)
        );

        return {
          ...base,
          replies: formattedReplies,
        };
      }

      return base;
    });

    allComments = allComments.concat(formatted);

    nextPageToken = response.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  return allComments;
}

const formatComment = (
  comment: youtube_v3.Schema$Comment,
  videoId: string
): CommentBase => {
  return {
    id: comment.id ?? "",
    channelId: comment.snippet?.channelId ?? "",
    videoId: videoId,
    authorDisplayName: comment.snippet?.authorDisplayName ?? "",
    textDisplay: comment.snippet?.textDisplay ?? "",
    textOriginal: comment.snippet?.textOriginal ?? "",
    publishedAt: comment.snippet?.publishedAt ?? "",
  };
};
