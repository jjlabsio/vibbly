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
  SocialAccount,
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

  const socialAccounts = await prisma.socialAccount.findMany();

  const { automationLog, summary } = await prisma.$transaction(
    async (tx) => {
      // 1. log 생성
      const automationLog = await tx.automationRunLog.create({
        data: {
          job: AutomationJob.DETECT,
          plan: AutomationPlan.BASIC,
        },
      });

      // 2. 각 계정별 댓글 탐지
      // Todo: 채널이 너무 많아지면 p-limit 적용 추후에 고려
      const results: Result[] = await Promise.all(
        socialAccounts.map(async (account) => {
          try {
            const [allCommentsNum, commentsToDelete] =
              await detectComments(account);
            // 검사 후 삭제 예정 큐에 추가
            await tx.comment.createMany({
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
                  socialAccountExternalId: channelId,
                  contentId: videoId,
                  authorDisplayName,
                  textDisplay,
                  textOriginal,
                  publishedAt,
                  status: CommentStatus.SpamPendingDelete,
                  detectRunId: automationLog.id,
                })
              ),
              skipDuplicates: true,
            });

            return {
              success: true,
              accountId: account.externalId,
              userId: account.userId,
              detectionCount: allCommentsNum,
              removeCommentNum: commentsToDelete.length,
              removeCommentIds: commentsToDelete.map((comment) => comment.id),
            };
          } catch (error) {
            console.error(error);
            return { success: false, accountId: account.externalId };
          }
        })
      );

      // 3. metrics 저장
      await tx.automationRunAccountMetric.createMany({
        data: results
          .filter((result) => result.success)
          .map((result) => ({
            runId: automationLog.id,
            socialAccountExternalId: result.accountId,
            userId: result.userId,
            detectionCount: result.detectionCount,
            newSpamCount: result.removeCommentNum,
          })),
      });

      // 4. log 업데이트
      const completedAt = new Date();
      const durationMs =
        completedAt.getTime() - automationLog.startedAt.getTime();
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

      await tx.automationRunLog.update({
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

      return {
        automationLog,
        summary: {
          detectionCount,
          newSpamCount,
        },
      };
    },
    {
      maxWait: 1000 * 5, // 5초
      timeout: 1000 * 60 * 10, // 10분
    }
  );

  return Response.json({
    success: true,
    runId: automationLog.id,
    summary: {
      totalAccounts: socialAccounts.length,
      detectionCount: summary.detectionCount,
      newSpamCount: summary.newSpamCount,
    },
  });
}

const detectComments = async (
  account: SocialAccount
): Promise<[number, CommentThreadsBase[]]> => {
  const client = await getYouTubeClient(account);

  // 모든 댓글 조회
  const comments = await paginateList<
    youtube_v3.Params$Resource$Commentthreads$List,
    CommentThreadsBase,
    youtube_v3.Schema$CommentThreadListResponse
  >({
    listFn: (params) => client.commentThreads.list(params),
    initParams: {
      part: ["snippet", "replies"],
      allThreadsRelatedToChannelId: account.externalId,
      maxResults: 100,
      order: "time", // relevance = 인기댓글순. time = 최신순
    },
    parseItems: (res) => parseItems(res, true),
  });

  // 댓글 검사
  const keywords = await prisma.keyword.findMany({
    where: {
      userId: account.userId,
    },
    select: {
      text: true,
    },
  });
  const commentsToDelete = comments.filter(({ textOriginal }) =>
    keywords.some((keyword) => textOriginal.includes(keyword.text))
  );

  return [comments.length, commentsToDelete];
};
