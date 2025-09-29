import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getYouTubeClient } from "@/lib/youtube-account";
import { youtube_v3 } from "googleapis";

interface Channel {
  id: string;
  title: string;
  description: string;
  profileUrl: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Todo
  //     const auth = req.headers.get("Authorization");
  //   if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

  //   const token = auth.replace("Bearer ", "");
  //   const payload = verifyJwt(token); // userId 등 decode
  //   const userId = payload.sub;
  const { userId } = await params;

  const accounts = await db.youtubeAccount.findMany({
    where: { userId },
  });

  const result: Channel[] = [];

  for (const account of accounts) {
    const client = await getYouTubeClient(account.channelId);
    const channels = await client.channels.list({
      part: ["id", "snippet"],
      id: [account.channelId],
    });
    const channel = channels.data.items![0] as youtube_v3.Schema$Channel;
    const channelData: Channel = {
      id: channel.id ?? "",
      title: channel.snippet?.title ?? "",
      description: channel.snippet?.description ?? "",
      profileUrl: channel.snippet?.thumbnails?.default?.url ?? "",
    };
    result.push(channelData);
  }

  return NextResponse.json(result);
}
