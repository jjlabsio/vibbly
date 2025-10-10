"use client";

import * as React from "react";
import * as Icons from "@vibbly/ui/components/icons";

import { NavBlock } from "@/components/nav-block";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@vibbly/ui/components/sidebar";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Sidebar");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const snsMenu = {
    category: t("snsCategory"),
    items: [
      {
        name: t("dashboard"),
        url: "/dashboard",
        icon: Icons.ChartArea,
      },
      {
        name: t("comment"),
        url: "/comments",
        icon: Icons.MessageCircleMore,
      },
      {
        name: t("keyword"),
        url: "/keywords",
        icon: Icons.List,
      },
      {
        name: t("settings"),
        url: "/settings",
        icon: Icons.Settings,
      },
    ],
  };

  const accountMenu = {
    category: t("accountCategory"),
    items: [
      {
        name: t("planUpgrade"),
        url: "/upgrade",
        icon: Icons.Gem,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <div className="bg-blue-500 size-[32px] flex items-center justify-center font-black text-foreground rounded-md cursor-default">
                V
              </div>
            ) : (
              <div className="p-2">
                <Image
                  src="/logo.png"
                  alt="vibbly logo"
                  width={90}
                  height={32}
                />
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavBlock category={snsMenu.category} items={snsMenu.items} />
        <NavBlock category={accountMenu.category} items={accountMenu.items} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
