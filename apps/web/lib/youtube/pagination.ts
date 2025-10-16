import type { GaxiosResponseWithHTTP2 } from "googleapis-common";

export type GoogleListFn<Params, Response> = {
  (params: Params, options?: any): Promise<GaxiosResponseWithHTTP2<Response>>;
};

export type paginateListParams<
  TParams,
  TItem,
  TResponse extends MaybeNextPageToken,
> = {
  listFn: GoogleListFn<TParams, TResponse>;
  initParams: TParams;
  parseItems: (response: TResponse) => TItem[];
};

export type MaybeNextPageToken = {
  nextPageToken?: string | null;
};

const getNextPageToken = (response: MaybeNextPageToken) => {
  return response.nextPageToken ?? undefined;
};

export const paginateList = async <
  TParams,
  TItem,
  TResponse extends MaybeNextPageToken,
>({
  listFn,
  initParams,
  parseItems,
}: paginateListParams<TParams, TItem, TResponse>) => {
  const items: TItem[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const params: TParams = {
      ...initParams,
      pageToken: nextPageToken,
    };
    const response = await listFn(params);
    const parsedItems = parseItems(response.data);

    items.push(...parsedItems);

    nextPageToken = getNextPageToken(response.data);
  } while (nextPageToken);

  return items;
};
