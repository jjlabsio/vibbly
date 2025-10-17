import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";
import { paginateList } from "@/lib/youtube/pagination";
import { CommentThreadsBase } from "@/types/comment-threads";
import { youtube_v3 } from "googleapis";
import { parseItems } from "@/lib/youtube/comment-threads";
import { CommentStatus, YoutubeAccount } from "@/generated/prisma";

export async function GET(request: Request) {
  const env = process.env.NODE_ENV;

  if (env === "production") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }
  }

  const channels = await prisma.youtubeAccount.findMany();

  // Todo: 채널이 너무 많아지면 p-limit 적용 추후에 고려
  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        const result = await detectProcess(channel);
        return { success: result, channelId: channel.channelId };
      } catch (error) {
        return { success: false, channelId: channel.channelId };
      }
    })
  );

  return Response.json(results);
}

const detectProcess = async (channel: YoutubeAccount) => {
  const client = await getYouTubeClient(channel);

  // 모든 댓글 조회
  const comments = await paginateList<
    youtube_v3.Params$Resource$Commentthreads$List,
    CommentThreadsBase,
    youtube_v3.Schema$CommentThreadListResponse
  >({
    listFn: (params) => client.commentThreads.list(params),
    initParams: {
      part: ["snippet", "replies"],
      allThreadsRelatedToChannelId: channel.channelId,
      maxResults: 100,
      order: "time", // relevance = 인기댓글순. time = 최신순
    },
    parseItems: (res) => parseItems(res, true),
  });

  // 댓글 검사
  const keywords = await prisma.keyword.findMany({
    where: {
      userId: channel.userId,
    },
    select: {
      text: true,
    },
  });
  const removeComments = comments.filter(({ textOriginal }) =>
    keywords.some((keyword) => textOriginal.includes(keyword.text))
  );

  // 검사 후 삭제 예정 큐에 추가
  await prisma.comment.createMany({
    data: removeComments.map(
      ({
        id,
        channelId,
        videoId,
        authorDisplayName,
        textDisplay,
        textOriginal,
        publishedAt,
      }) => ({
        id,
        channelId,
        videoId,
        authorDisplayName,
        textDisplay,
        textOriginal,
        publishedAt,
        status: CommentStatus.SpamPendingDelete,
      })
    ),
    skipDuplicates: true,
  });

  return true;
};
