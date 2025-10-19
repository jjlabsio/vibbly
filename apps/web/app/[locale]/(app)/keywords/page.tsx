"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";

import { columns } from "@/components/keywords/columns";
import { DataTable } from "@/components/keywords/data-table";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Keyword } from "@/generated/prisma";
import { useTranslations } from "next-intl";

const fetchKeywords = async () => {
  const res = await api.get<Keyword[]>("/api/keywords");
  if (!res.data) {
    throw Error("/api/keywords api 조회실패");
  }
  return res.data;
};

export default function Page() {
  const t = useTranslations("Keywords");

  const { data } = useQuery({
    queryKey: ["keywords"],
    queryFn: fetchKeywords,
    initialData: [],
  });

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
