import { YoutubeAccount } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";
import { paginateList } from "@/lib/youtube/pagination";
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

type AccountWithVideos = {
  accountInfo: YoutubeAccount | null;
  videos: Channels["videos"];
};

function hasAccountInfo(el: AccountWithVideos): el is Omit<
  AccountWithVideos,
  "accountInfo"
> & {
  accountInfo: YoutubeAccount;
} {
  return el.accountInfo !== null;
}

// getYoutubeClient 리팩토링에 대한 대응을 러프하게 작성한 버전
// 정리가 필요함
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

  const accountPromises = channels.map(async (channel) => {
    const account = await prisma.youtubeAccount.findUnique({
      where: {
        channelId: channel.id,
      },
    });

    return {
      accountInfo: account,
      videos: channel.videos,
    };
  });

  const accounts = (await Promise.all(accountPromises)).filter(hasAccountInfo);

  for (const account of accounts) {
    const newPromise = async () => {
      const client = await getYouTubeClient(account.accountInfo);
      const channelComments: Comment[] = [];

      for (const video of account.videos) {
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

async function getAllComments(client: youtube_v3.Youtube, videoId: string) {
  const parseItems = (
    res: youtube_v3.Schema$CommentThreadListResponse
  ): Comment[] => {
    const items = res.items || [];

    return items.flatMap((item) => {
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
  };

  const comments = await paginateList<
    youtube_v3.Params$Resource$Commentthreads$List,
    Comment,
    youtube_v3.Schema$CommentThreadListResponse
  >({
    listFn: (params) => client.commentThreads.list(params),
    initParams: {
      part: ["snippet", "replies"],
      videoId: videoId,
      maxResults: 100,
      order: "time", // relevance = 인기댓글순. time = 최신순
    },
    parseItems,
  });

  return comments;
}
