import { VideoTable } from "@/components/youtube/video-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("Comments");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="text-4xl font-black">{t("title")}</div>
      <Card>
        <CardHeader>
          <CardTitle>{t("videoList")}</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoTable />
        </CardContent>
      </Card>
    </div>
  );
}
