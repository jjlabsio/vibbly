"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@vibbly/ui/components/dialog";
import { Button } from "@vibbly/ui/components/button";
import type { Channels } from "./data-table";
import { api } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@vibbly/ui/components/tooltip";
import { Spinner } from "@vibbly/ui/components/spinner";
import { useState } from "react";
import { Comment } from "@/app/api/comment-threads/route";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videos: Channels[];
}

export function DialogButton({ open, onOpenChange, videos }: Props) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const handleOpen = async (value: boolean) => {
    if (videos.length === 0) {
      return;
    }

    setLoading(true);
    if (value) {
      const query = encodeURIComponent(JSON.stringify(videos));
      const { data } = await api.get<Comment[]>(
        `/api/comment-threads?channels=${query}`
      );
      setComments(data);
      console.log("data :>> ", data);
    }

    onOpenChange(value);

    setLoading(false);
  };

  const disabled = videos.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <div>
              <Button disabled={disabled}>
                {loading ? (
                  <span className="flex gap-2 items-center justify-center">
                    <Spinner /> Loading...
                  </span>
                ) : (
                  "Open Dialog"
                )}
              </Button>
            </div>
          </DialogTrigger>
        </TooltipTrigger>
        {disabled && (
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        )}
      </Tooltip>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          {open && <div className="text-sm text-muted-foreground"></div>}
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <div key={comment.id}>
                <div>{comment.textOriginal}</div>
                {comment.replies &&
                  comment.replies.map((reply) => (
                    <div key={reply.id}>{reply.textOriginal}</div>
                  ))}
              </div>
            ))}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
