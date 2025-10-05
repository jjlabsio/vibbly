import { auth } from "@/auth";
import { oauthAccount } from "@/lib/temp-action";
import { Button } from "@vibbly/ui/components/button";

export async function YoutubeAccount() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const url = `/api/youtube/connect?email=${session.user.email}`;

  return (
    <Button asChild>
      <a href={url}>Add Youtube Account</a>
    </Button>
  );
}
