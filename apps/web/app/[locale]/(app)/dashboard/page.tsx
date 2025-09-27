import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@vibbly/ui/components/button";
import { getTranslations } from "next-intl/server";
import { getYouTubeClient } from "@/lib/youtube-account";
import { DeleteComponent } from "@/components/delete-component";

async function Temp() {
  const user = await currentUser();
  if (!user) {
    throw Error("There is no user");
  }

  const client = await getYouTubeClient(user.id);
  const channel = await client.channels.list({
    mine: true,
    part: ["id", "snippet"],
  });

  console.log("channel.data.items :>> ", channel.data.items);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // await Temp();

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
          <div>table</div>

          <DeleteComponent userId={user.id} />
        </div>
      </div>
    </div>
  );
}
