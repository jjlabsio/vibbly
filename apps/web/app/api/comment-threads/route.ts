// 이미 유튜브에 있는 기능이라 MVP에서 제공하지 않을 기능
// 굳이 유지보수 비용을 쓸 필요 없어서 그냥 더미처리하고 나중에 작업함
export async function GET() {
  return Response.json({ message: "추후에 다시 개발할 기능입니다." });
}

// import { YoutubeAccount } from "@/generated/prisma";
// import prisma from "@/lib/prisma";
// import { getYouTubeClient } from "@/lib/youtube-account";
// import { parseItems } from "@/lib/youtube/comment-threads";
// import { paginateList } from "@/lib/youtube/pagination";
// import { CommentThreads } from "@/types/comment-threads";
// import { youtube_v3 } from "googleapis";
// import { NextRequest, NextResponse } from "next/server";

// export interface Channels {
//   id: string;
//   videos: string[];
// }

// type AccountWithVideos = {
//   accountInfo: YoutubeAccount | null;
//   videos: Channels["videos"];
// };

// function hasAccountInfo(el: AccountWithVideos): el is Omit<
//   AccountWithVideos,
//   "accountInfo"
// > & {
//   accountInfo: YoutubeAccount;
// } {
//   return el.accountInfo !== null;
// }

// // getYoutubeClient 리팩토링에 대한 대응을 러프하게 작성한 버전
// // 정리가 필요함
// export async function GET(req: NextRequest) {
//   const searchParams = req.nextUrl.searchParams;
//   const channelsParams = searchParams.get("channels");

//   if (!channelsParams) {
//     return Response.json(
//       { error: "Channels parameter is required" },
//       { status: 400 }
//     );
//   }

//   const channels = JSON.parse(channelsParams) as Channels[];
//   const promiseList: Promise<CommentThreads[]>[] = [];

//   const accountPromises = channels.map(async (channel) => {
//     const account = await prisma.youtubeAccount.findUnique({
//       where: {
//         channelId: channel.id,
//       },
//     });

//     return {
//       accountInfo: account,
//       videos: channel.videos,
//     };
//   });

//   const accounts = (await Promise.all(accountPromises)).filter(hasAccountInfo);

//   for (const account of accounts) {
//     const newPromise = async () => {
//       const client = await getYouTubeClient(account.accountInfo);
//       const channelComments: CommentThreads[] = [];

//       for (const video of account.videos) {
//         const comments = await getAllComments(client, video);
//         channelComments.push(...comments);
//       }

//       return channelComments;
//     };

//     promiseList.push(newPromise());
//   }

//   const allComments = (await Promise.all(promiseList)).flat();

//   return NextResponse.json(allComments);
// }

// async function getAllComments(client: youtube_v3.Youtube, videoId: string) {
//   const comments = await paginateList<
//     youtube_v3.Params$Resource$Commentthreads$List,
//     CommentThreads,
//     youtube_v3.Schema$CommentThreadListResponse
//   >({
//     listFn: (params) => client.commentThreads.list(params),
//     initParams: {
//       part: ["snippet", "replies"],
//       videoId: videoId,
//       maxResults: 100,
//       order: "time", // relevance = 인기댓글순. time = 최신순
//     },
//     parseItems,
//   });

//   return comments;
// }
