import { CommentStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";

type Result = {
  success: boolean;
  deletedIds: string[];
  message?: string;
};

export async function GET() {
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

  const result: Result[] = await Promise.all(
    channelIds.map(async (channelId) => {
      const commentIds = commentMap.get(channelId);
      if (!commentIds) {
        return {
          success: false,
          deletedIds: [],
          message: "There is no pending comment id for this channel",
        };
      }

      try {
        await deleteProcess(channelId, commentIds);

        return {
          success: true,
          deletedIds: commentIds,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          deletedIds: [],
          message: `Delete comment failed for channel ${channelId} `,
        };
      }
    })
  );

  return Response.json(result);
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
};
