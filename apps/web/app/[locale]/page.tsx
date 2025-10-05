import { auth } from "@/auth";
import { SignOut } from "@/components/auth/sign-out";
import Link from "next/link";

export default async function Page() {
  const session = await auth();

  return (
    <div className="h-screen flex flex-col gap-4 items-center justify-center">
      <div>
        <div>
          {session
            ? `session : ${JSON.stringify(session, null, 2)}`
            : "no session"}
        </div>
      </div>
      <Link href="/sign-in">sign in</Link>
      <SignOut />
    </div>
  );
}
