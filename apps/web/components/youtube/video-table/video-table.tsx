import { currentUser } from "@clerk/nextjs/server";
import { DataTable } from "./data-table";
import { columns, Content } from "./columns";

export async function VideoTable() {
  const user = await currentUser();
  if (!user) {
    throw Error("There is no user");
  }

  const baseUrl = process.env.SERVICE_BASE_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/users/${user.id}/contents`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw Error("Failed to load contents");
  }

  const payload = await response.json();
  const rawVideos = Array.isArray(payload?.data)
    ? (payload.data as Content[])
    : [];

  const videoList = rawVideos.filter(
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
