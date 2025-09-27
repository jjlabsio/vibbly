import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const youtube = google.youtube("v3");
  const comments = await youtube.commentThreads.list({
    part: ["snippet", "replies"],
    videoId: "0D8ktRUI570",
    maxResults: 100,
    order: "relevance", // 인기댓글순. time = 최신순
    key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!,
  });

  return NextResponse.json(comments.data);
}
