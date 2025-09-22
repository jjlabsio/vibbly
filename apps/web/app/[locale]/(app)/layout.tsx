import { NavBar } from "@/components/navbar";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function Page({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("HomePage");
  return (
    <div className="flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <div>{t("title")}</div>
    </div>
  );
}
