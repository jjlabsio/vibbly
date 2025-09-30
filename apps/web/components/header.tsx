import { LocaleChange } from "./locale-change";
import { HeaderUser } from "./nav-user";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "@vibbly/ui/components/sidebar";

export async function Header() {
  return (
    <header className="sticky top-0 z-1 bg-background flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between gap-2 px-6">
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center gap-2">
          <LocaleChange />

          <ModeToggle />

          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
