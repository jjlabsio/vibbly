import * as Icons from "@vibbly/ui/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@vibbly/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vibbly/ui/components/dropdown-menu";
import { SignOut } from "./auth/sign-out";
import { auth } from "@/auth";

export const HeaderUser = async () => {
  const session = await auth();

  if (!session) {
    return null;
  }

  const user = {
    name: session.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session.user?.image ?? undefined,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage alt="user avatar" />
          <AvatarFallback className="rounded-lg">
            {user.name.length > 1 ? user.name[0] : user.name}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={"bottom"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Icons.Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          {/* <Icons.LogOut />
          Log out */}
          <SignOut />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
