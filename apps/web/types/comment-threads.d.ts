export interface CommentThreadsBase {
  id: string;
  channelId: string;
  videoId: string;
  authorDisplayName: string;
  textDisplay: string;
  textOriginal: string;
  publishedAt: string;
}

export interface CommentThreads extends CommentThreadsBase {
  replies?: CommentThreads[];
}
