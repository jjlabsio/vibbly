import { LocaleChange } from "./locale-change";
import { HeaderUser } from "./nav-user";
import { ModeToggle } from "./mode-toggle";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarTrigger } from "@vibbly/ui/components/sidebar";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

export async function Header() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const safeUser = {
    // name: user.firstName ?? "",
    email: user.primaryEmailAddress?.emailAddress ?? "email",
    avatar: user.imageUrl,
  };

  return (
    <header className="sticky top-0 bg-background flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between gap-2 px-6">
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center gap-2">
          <LocaleChange />

          <ModeToggle />

          <HeaderUser user={safeUser} />
        </div>
      </div>
    </header>
  );
}
