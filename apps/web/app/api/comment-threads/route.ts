import { NextResponse } from "next/server";

const baseUrl = "https://youtube.googleapis.com/youtube/v3/commentThreads";

export async function GET() {
  const params = {
    part: "snippet,replies",
    videoId: "kdWvz4UtoSQ",
    maxResults: "100",
    order: "relevance", // 인기댓글순. time = 최신순
    key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "",
  };
  const queryString = new URLSearchParams(params).toString();
  const url = `${baseUrl}?${queryString}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  return NextResponse.json(data);
}
