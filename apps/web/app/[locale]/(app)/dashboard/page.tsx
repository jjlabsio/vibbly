import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col">
      <div className="text-4xl font-bold">{t("title")}</div>
    </div>
  );
}
