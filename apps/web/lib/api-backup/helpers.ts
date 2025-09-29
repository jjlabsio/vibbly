import type { QueryParams } from "./types";

const isDefined = (
  value: unknown
): value is Exclude<unknown, null | undefined> =>
  value !== null && value !== undefined;

export const createQueryString = (params: QueryParams = {}): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!isDefined(value)) {
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

export const appendQueryParams = (
  path: string,
  params: QueryParams = {}
): string => {
  const query = createQueryString(params);

  if (!query) {
    return path;
  }

  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
};

export const pickDefined = <T extends Record<string, unknown>>(
  input: T
): Partial<T> => {
  const entries = Object.entries(input).filter(([, value]) => isDefined(value));
  return Object.fromEntries(entries) as Partial<T>;
};

export const mergeQueryParams = (
  base: QueryParams,
  next: QueryParams
): QueryParams => ({
  ...base,
  ...next,
});
