import { signIn } from "@/auth";
import { Button } from "@vibbly/ui/components/button";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <Button type="submit">Sign in with Google</Button>
    </form>
  );
}
