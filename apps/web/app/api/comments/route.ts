import prisma from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const commentId = searchParams.get("commentId");

  if (!userId)
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (!commentId)
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  try {
    const channel = await prisma.youtubeAccount.findUnique({
      where: {
        channelId: userId,
      },
    });

    if (!channel) {
      return new Response("No channel matched", { status: 404 });
    }

    const youtubeClient = await getYouTubeClient(channel);
    // comments.delete는 자신이 작성한 댓글만 삭제 가능
    const result = await youtubeClient.comments.setModerationStatus({
      id: [commentId],
      moderationStatus: "rejected",
    });

    return NextResponse.json(result.data);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "YoutubeClient error" }, { status: 400 });
  }
}
