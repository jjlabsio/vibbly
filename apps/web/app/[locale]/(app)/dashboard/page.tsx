import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@vibbly/ui/components/button";
import { getTranslations } from "next-intl/server";
import { VideoTable } from "@/components/youtube/video-table";

export default async function Page() {
  const t = await getTranslations("Dashboard");

  const user = await currentUser();
  if (!user) {
    throw Error("There is no user");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="text-4xl font-black">{t("title")}</div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl">
        <div>Video List</div>
        <div className="flex flex-col">
          <div>
            <Button asChild>
              <a href="/api/youtube/connect">Add Youtube Channel</a>
            </Button>
          </div>
          <div>
            <VideoTable />
          </div>
        </div>
      </div>
    </div>
  );
}
