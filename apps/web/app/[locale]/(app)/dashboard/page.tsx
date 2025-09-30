import { Button } from "@vibbly/ui/components/button";
import { getTranslations } from "next-intl/server";
import { VideoTable } from "@/components/youtube/video-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";

interface Channel {
  id: string;
  title: string;
  description: string;
  profileUrl: string;
}

export default async function Page() {
  const t = await getTranslations("Dashboard");

  // const { data: channels } = await api.get<Channel[]>(
  //   `/api/users/${user.id}/channels`
  // );
  const channels: any[] = [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="text-4xl font-black">{t("title")}</div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>연동된 채널 개수</CardTitle>
          </CardHeader>
          <CardContent>
            <div>{channels.length}개</div>
            <div>list</div>
            <div>
              {channels.map((channel) => (
                <div key={channel.id}>{channel.title}</div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sample</CardTitle>
          </CardHeader>
          <CardContent>content</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sample</CardTitle>
          </CardHeader>
          <CardContent>content</CardContent>
        </Card>
      </div>
      <Card className="">
        <CardHeader>
          <CardTitle>컨텐츠 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Button asChild>
              <a href="/api/youtube/connect">Add Youtube Channel</a>
            </Button>
          </div>
          <div>
            <VideoTable />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
