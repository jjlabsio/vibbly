import { getKeywords } from "@/lib/keyword";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";
import { getTranslations } from "next-intl/server";

import { columns } from "@/components/keywords/columns";
import { DataTable } from "@/components/keywords/data-table";

export default async function Page() {
  const t = await getTranslations("Keywords");
  const data = await getKeywords();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="text-4xl font-black">{t("title")}</div>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
