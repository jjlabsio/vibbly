import { SignOutButton } from "@clerk/nextjs";

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        header content
        <SignOutButton />
      </header>
      <div>{children}</div>
    </div>
  );
}
