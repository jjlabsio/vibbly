import { CommentThreads, CommentThreadsBase } from "@/types/comment-threads";
import { youtube_v3 } from "googleapis";

export const formatComment = (
  comment: youtube_v3.Schema$Comment
): CommentThreadsBase => {
  return {
    id: comment.id ?? "",
    channelId: comment.snippet?.channelId ?? "",
    videoId: comment.snippet?.videoId ?? "",
    authorDisplayName: comment.snippet?.authorDisplayName ?? "",
    textDisplay: comment.snippet?.textDisplay ?? "",
    textOriginal: comment.snippet?.textOriginal ?? "",
    publishedAt: comment.snippet?.publishedAt ?? "",
  };
};

export const parseItems = <T extends boolean>(
  res: youtube_v3.Schema$CommentThreadListResponse,
  flat?: T
): T extends true ? CommentThreadsBase[] : CommentThreads[] => {
  const items = res.items || [];

  return items.flatMap((item) => {
    const topLevelComment = item.snippet?.topLevelComment; // comment resource
    const replies = item.replies?.comments; // (comment resource)[]

    if (!topLevelComment) return [];

    const base = formatComment(topLevelComment);

    if (replies) {
      const formattedReplies = replies.map(formatComment);

      return flat
        ? [base, ...formattedReplies]
        : {
            ...base,
            replies: formattedReplies,
          };
    }

    return base;
  });
};
