"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@vibbly/ui/components/sidebar";
import { Link, usePathname } from "@/i18n/navigation";

interface NavBlockProps {
  category: string;
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}

function isItemActive(currentPathname: string, itemUrl: string) {
  if (currentPathname === itemUrl) return true;
  return currentPathname.startsWith(`${itemUrl}/`);
}

export function NavBlock({ category, items }: NavBlockProps) {
  const pathname = usePathname();
  const [mountedPathname, setMountedPathname] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    setMountedPathname(pathname);
  }, [pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        {category}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={
                mountedPathname
                  ? isItemActive(mountedPathname, item.url)
                  : false
              }
              tooltip={item.name}
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
