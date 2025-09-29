"use client";

import { useCallback, useMemo } from "react";
import { clientApi } from "@/lib/api-backup";
import type {
  ApiResponse,
  EndpointInput,
  RequestOptions,
} from "@/lib/api-backup";

type MutationMethod = "post" | "put" | "patch" | "delete";

type MutationHandler<T> = (
  payload?: unknown,
  options?: RequestOptions
) => Promise<ApiResponse<T>>;

type QueryHandler<T> = (options?: RequestOptions) => Promise<ApiResponse<T>>;

export const useApi = () => useMemo(() => clientApi, []);

export const useApiQuery = <T>(endpoint: EndpointInput): QueryHandler<T> => {
  const api = useApi();

  return useCallback(
    async (options?: RequestOptions) => {
      return api.get<T>(endpoint, options);
    },
    [api, endpoint]
  );
};

export const useApiMutation = <T>(
  method: MutationMethod,
  endpoint: EndpointInput
): MutationHandler<T> => {
  const api = useApi();

  return useCallback<MutationHandler<T>>(
    async (payload, options = {}) => {
      switch (method) {
        case "post":
          return api.post<T>(endpoint, payload, options);
        case "put":
          return api.put<T>(endpoint, payload, options);
        case "patch":
          return api.patch<T>(endpoint, payload, options);
        case "delete":
          return api.delete<T>(endpoint, payload, options);
      }
    },
    [api, endpoint, method]
  );
};
