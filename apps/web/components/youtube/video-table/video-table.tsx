import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getMyVideos } from "@/lib/youtube/me";

export async function VideoTable() {
  const videos = await getMyVideos();

  return (
    <div className="flex flex-col gap-6">
      <DataTable columns={columns} data={videos} />
    </div>
  );
}
