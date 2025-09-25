"use client";

import * as React from "react";
import { ChartArea, Settings, Gem } from "lucide-react";

import { NavBlock } from "@/components/nav-block";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@vibbly/ui/components/sidebar";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Sidebar");

  const snsMenu = {
    category: t("snsCategory"),
    items: [
      {
        name: t("dashboard"),
        url: "/dashboard",
        icon: ChartArea,
      },
      {
        name: t("settings"),
        url: "/settings",
        icon: Settings,
      },
    ],
  };

  const accountMenu = {
    category: t("accountCategory"),
    items: [
      {
        name: t("planUpgrade"),
        url: "/upgrade",
        icon: Gem,
      },
    ],
  };

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="p-2">
              <Image src="/logo.png" alt="vibbly logo" width={90} height={32} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavBlock category={snsMenu.category} items={snsMenu.items} />
        <NavBlock category={accountMenu.category} items={accountMenu.items} />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
