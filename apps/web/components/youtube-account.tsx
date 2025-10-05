import { Button } from "@vibbly/ui/components/button";

export async function YoutubeAccount() {
  const url = `/api/youtube/connect`;

  return (
    <Button asChild>
      <a href={url}>Add Youtube Account</a>
    </Button>
  );
}
