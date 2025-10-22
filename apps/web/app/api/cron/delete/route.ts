import {
  AutomationJob,
  AutomationPlan,
  AutomationRunStatus,
  CommentStatus,
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

  // 1. start run log
  const automationLog = await prisma.automationRunLog.create({
    data: {
      job: AutomationJob.DELETE,
      plan: AutomationPlan.BASIC,
    },
  });

  // 2. delete
  const pendingDeleteComments = await prisma.comment.findMany({
    where: {
      status: CommentStatus.SpamPendingDelete,
    },
    select: {
      id: true,
      channelId: true,
    },
  });

  const commentMap = new Map<string, string[]>();

  pendingDeleteComments.forEach(({ id, channelId }) => {
    if (!commentMap.has(channelId)) {
      commentMap.set(channelId, []);
    }

    commentMap.get(channelId)!.push(id);
  });

  const channelIds = Array.from(commentMap.keys());

  const results: Result[] = await Promise.all(
    channelIds.map(async (channelId) => {
      const commentIds = commentMap.get(channelId);
      if (!commentIds) {
        return {
          success: false,
          accountId: channelId,
        };
      }

      try {
        const { userId } = await deleteProcess(channelId, commentIds);

        return {
          success: true,
          accountId: channelId,
          userId,
          deletedCommentNum: commentIds.length,
          deletedCommentIds: commentIds,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          accountId: channelId,
        };
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
        deletionCount: result.deletedCommentNum,
      })),
  });

  // 4. complete run log
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - automationLog.startedAt.getTime();
  const deletionCount = results
    .filter((result) => result.success)
    .reduce((acc, cur) => acc + cur.deletedCommentNum, 0);

  await prisma.automationRunLog.update({
    where: {
      id: automationLog.id,
    },
    data: {
      status: AutomationRunStatus.SUCCESS,
      completedAt,
      durationMs,
      deletionCount,
    },
  });

  return Response.json(results);
}

const deleteProcess = async (channelId: string, commentIds: string[]) => {
  const channel = await prisma.youtubeAccount.findUnique({
    where: {
      channelId: channelId,
    },
  });
  if (!channel) {
    throw Error("There is no matched channel");
  }

  const client = await getYouTubeClient(channel);
  await client.comments.setModerationStatus({
    id: commentIds,
    moderationStatus: "rejected",
  });

  const deletedAt = new Date();
  const result = await prisma.comment.updateMany({
    where: {
      id: {
        in: commentIds,
      },
    },
    data: {
      status: CommentStatus.Deleted,
      deletedAt,
    },
  });
  result.count;

  return {
    userId: channel.userId,
    deletedAt,
  };
};
