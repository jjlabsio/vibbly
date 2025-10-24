import {
  AutomationJob,
  AutomationPlan,
  AutomationRunStatus,
  CommentStatus,
  SocialAccount,
} from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";

type Result = SuccessResult | FailResult;

type SuccessResult = {
  success: true;
  accountId: string;
  userId: string;
  deletedCommentNum: number;
  deletedCommentIds: string[];
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

  const commentMap = await getPendingDeleteCommentsMap();
  const externalIds = Array.from(commentMap.keys());

  const { automationLog, summary } = await prisma.$transaction(
    async (tx) => {
      // 1. log 생성
      const automationLog = await tx.automationRunLog.create({
        data: {
          job: AutomationJob.DELETE,
          plan: AutomationPlan.BASIC,
        },
      });

      // 2. 댓글 삭제
      const results: Result[] = await Promise.all(
        externalIds.map(async (externalId) => {
          const entry = commentMap.get(externalId);
          if (!entry) {
            return {
              success: false,
              accountId: externalId,
            };
          }

          const { account, commentIds } = entry;

          try {
            await deleteComments(account, commentIds);

            await tx.comment.updateMany({
              where: {
                id: {
                  in: commentIds,
                },
              },
              data: {
                status: CommentStatus.Deleted,
                deleteRunId: automationLog.id,
              },
            });

            return {
              success: true,
              accountId: externalId,
              userId: account.userId,
              deletedCommentNum: commentIds.length,
              deletedCommentIds: commentIds,
            };
          } catch (error) {
            console.error(error);
            return {
              success: false,
              accountId: externalId,
            };
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
            deletionCount: result.deletedCommentNum,
          })),
      });

      // 4. log 업데이트
      const completedAt = new Date();
      const durationMs =
        completedAt.getTime() - automationLog.startedAt.getTime();
      const deletionCount = results
        .filter((result) => result.success)
        .reduce((acc, cur) => acc + cur.deletedCommentNum, 0);

      const failedAccounts = results.filter((result) => !result.success);
      const status =
        failedAccounts.length > 0
          ? failedAccounts.length === results.length
            ? AutomationRunStatus.ERROR
            : AutomationRunStatus.WARNING
          : AutomationRunStatus.SUCCESS;

      await tx.automationRunLog.update({
        where: {
          id: automationLog.id,
        },
        data: {
          status,
          errorMessage:
            failedAccounts.length > 0
              ? `${failedAccounts.length} accounts failed`
              : null,
          completedAt,
          durationMs,
          deletionCount,
        },
      });

      return {
        automationLog,
        summary: {
          deletionCount,
        },
      };
    },
    {
      maxWait: 1000 * 5, // 5초
      timeout: 1000 * 60 * 5, // 10분
    }
  );

  return Response.json({
    success: true,
    runId: automationLog.id,
    summary: {
      totalAccounts: externalIds.length,
      deletionCount: summary.deletionCount,
    },
  });
}

const BATCH_SIZE = 100;

const deleteComments = async (account: SocialAccount, commentIds: string[]) => {
  const client = await getYouTubeClient(account);

  for (let i = 0; i < commentIds.length; i += BATCH_SIZE) {
    const batch = commentIds.slice(i, i + BATCH_SIZE);
    await client.comments.setModerationStatus({
      id: batch,
      moderationStatus: "rejected",
    });
  }
};

const getPendingDeleteCommentsMap = async () => {
  const pendingDeleteComments = await prisma.comment.findMany({
    where: {
      status: CommentStatus.SpamPendingDelete,
    },
    select: {
      id: true,
      socialAccountExternalId: true,
    },
  });

  const uniqueExternalIds = [
    ...new Set(
      pendingDeleteComments.map((comment) => comment.socialAccountExternalId)
    ),
  ];

  const socialAccounts = await prisma.socialAccount.findMany({
    where: {
      externalId: {
        in: uniqueExternalIds,
      },
    },
  });

  const commentMap = new Map<
    string,
    { account: SocialAccount; commentIds: string[] }
  >();
  socialAccounts.forEach((account) => {
    commentMap.set(account.externalId, {
      account,
      commentIds: [],
    });
  });

  pendingDeleteComments.forEach(({ id, socialAccountExternalId }) => {
    const entry = commentMap.get(socialAccountExternalId);
    if (entry) {
      entry.commentIds.push(id);
    }
  });

  return commentMap;
};
