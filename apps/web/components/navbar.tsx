import Link from "next/link";
import { MainNav } from "./main-nav";
import { LocaleChange } from "./locale-change";
import { NavUser } from "./nav-user";
import { ModeToggle } from "./mode-toggle";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

export async function NavBar() {
  const items: NavItem[] = [
    { title: "projects", href: "/projects" },
    { title: "contents", href: "/contents" },
  ];

  // const user = {
  //   name: "name1",
  //   email: "user@test.com",
  //   avatar: "avatar",
  // };

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
    <header className="flex w-full justify-center bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <MainNav />

        <div className="flex items-center space-x-3">
          {items.length ? (
            <nav className="hidden gap-6 md:flex">
              {items.map((item, index) => (
                <Link key={index} href={item.href}>
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null}

          <LocaleChange />

          <ModeToggle />

          <NavUser user={safeUser} />
        </div>
      </div>
    </header>
  );
}
