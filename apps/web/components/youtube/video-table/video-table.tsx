import { currentUser } from "@clerk/nextjs/server";
import { DataTable } from "./data-table";
import { columns, Content } from "./columns";
import { api } from "@/lib/api";

interface ContentDto {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
}

export async function VideoTable() {
  const user = await currentUser();
  if (!user) {
    throw Error("There is no user");
  }

  const { data: videos } = await api.get<ContentDto[]>(
    `/api/users/${user.id}/contents`
  );

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
