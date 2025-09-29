import { createQueryString } from "./helpers";
import type { EndpointDescriptor, EndpointInput, QueryParams } from "./types";

const toEndpoint = (path: string, query?: QueryParams): EndpointDescriptor => ({
  path,
  query,
});

export const endpoints = {
  core: {
    health: () => toEndpoint("/api"),
  },
  commentThreads: {
    list: () => toEndpoint("/api/comment-threads"),
  },
  comments: {
    remove: (params: { userId: string; commentId: string }) =>
      toEndpoint("/api/comments", params),
  },
  youtube: {
    connect: () => toEndpoint("/api/youtube/connect"),
    callback: () => toEndpoint("/api/youtube/callback"),
  },
  users: {
    channels: (userId: string) => toEndpoint(`/api/users/${userId}/channels`),
  },
} as const;

export type EndpointGroups = typeof endpoints;
type EndpointGroup = EndpointGroups[keyof EndpointGroups];
export type EndpointFactory = EndpointGroup[keyof EndpointGroup];

export const resolveEndpoint = (input: EndpointInput): string => {
  if (typeof input === "string") {
    return input;
  }

  const query = input.query ? createQueryString(input.query) : "";

  if (!query) {
    return input.path;
  }

  const separator = input.path.includes("?") ? "&" : "?";
  return `${input.path}${separator}${query}`;
};
