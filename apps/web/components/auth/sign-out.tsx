import { signOut } from "@/auth";
import { Button } from "@vibbly/ui/components/button";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({
          redirectTo: "/",
        });
      }}
    >
      <Button type="submit">Sign Out</Button>
    </form>
  );
}
