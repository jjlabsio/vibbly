import { DataTable } from "./data-table";
import { columns, Content } from "./columns";
import { getMyVideos } from "@/lib/youtube/me";

export async function VideoTable() {
  const videos = await getMyVideos();

  const videoList = videos.filter(
    (video): video is Content & { id: string } => {
      return Boolean(video?.id);
    }
  );

  return (
    <div className="flex flex-col gap-6">
      <DataTable columns={columns} data={videoList} />
    </div>
  );
}
