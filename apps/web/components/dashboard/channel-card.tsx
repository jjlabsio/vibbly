import { Channel } from "@/lib/youtube/me";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";
import * as Icons from "@vibbly/ui/components/icons";

export type ChannelCardProps = {
  channel: Channel;
};

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <Icons.Youtube className="h-8 w-8 fill-red-500" />
          <p>{channel.title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
