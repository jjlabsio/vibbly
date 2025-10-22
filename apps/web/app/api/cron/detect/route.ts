import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";
import { paginateList } from "@/lib/youtube/pagination";
import { CommentThreadsBase } from "@/types/comment-threads";
import { youtube_v3 } from "googleapis";
import { parseItems } from "@/lib/youtube/comment-threads";
import {
  AutomationJob,
  AutomationPlan,
  AutomationRunStatus,
  CommentStatus,
  Prisma,
  YoutubeAccount,
} from "@/generated/prisma";

type Result = SuccessResult | FailResult;

type SuccessResult = {
  success: true;
  accountId: string;
  userId: string;
  detectionCount: number;
  removeCommentNum: number;
  removeCommentIds: string[];
};

type FailResult = {
  success: false;
  accountId: string;
};

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

  // 1. start run log
  const automationLog = await prisma.automationRunLog.create({
    data: {
      job: AutomationJob.DETECT,
      plan: AutomationPlan.BASIC,
    },
  });

  // 2. detect
  const channels = await prisma.youtubeAccount.findMany();

  // Todo: 채널이 너무 많아지면 p-limit 적용 추후에 고려
  const results: Result[] = await Promise.all(
    channels.map(async (channel) => {
      try {
        const [allCommentsNum, commentsToDelete] = await detectProcess(channel);
        return {
          success: true,
          accountId: channel.channelId,
          userId: channel.userId,
          detectionCount: allCommentsNum,
          removeCommentNum: commentsToDelete.length,
          removeCommentIds: commentsToDelete.map((comment) => comment.id),
        };
      } catch (error) {
        return { success: false, accountId: channel.channelId };
      }
    })
  );

  // 3. account metric log
  await prisma.automationRunAccountMetric.createMany({
    data: results
      .filter((result) => result.success)
      .map((result) => ({
        runId: automationLog.id,
        socialAccountId: result.accountId,
        userId: result.userId,
        detectionCount: result.detectionCount,
        newSpamCount: result.removeCommentNum,
      })),
  });

  // 4. complete run log
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - automationLog.startedAt.getTime();
  const [detectionCount, newSpamCount] = results
    .filter((result) => result.success)
    .reduce(
      (acc, cur) => {
        const [accDetectionCount, accNewSpamCount] = acc;
        const curDetectionCount = cur.detectionCount;
        const curNewSpamCount = cur.removeCommentNum;

        return [
          accDetectionCount + curDetectionCount,
          accNewSpamCount + curNewSpamCount,
        ];
      },
      [0, 0]
    );

  await prisma.automationRunLog.update({
    where: {
      id: automationLog.id,
    },
    data: {
      status: AutomationRunStatus.SUCCESS,
      completedAt,
      durationMs,
      detectionCount,
      newSpamCount,
    },
  });

  return Response.json(results);
}

const detectProcess = async (
  channel: YoutubeAccount
): Promise<[number, CommentThreadsBase[]]> => {
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
  const commentsToDelete = comments.filter(({ textOriginal }) =>
    keywords.some((keyword) => textOriginal.includes(keyword.text))
  );

  // 검사 후 삭제 예정 큐에 추가
  await prisma.comment.createMany({
    data: commentsToDelete.map(
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

  return [comments.length, commentsToDelete];
};
