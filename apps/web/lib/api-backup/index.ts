import { resolveEndpoint } from "./endpoints";
import type {
  ApiCacheEntry,
  ApiConfig,
  ApiResponse,
  AuthConfig,
  EndpointInput,
  RequestOptions,
} from "./types";

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_CACHE_TTL = 60_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface NormalizedConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
  cache: {
    ttl: number;
    enabledByDefault: boolean;
  };
}

interface NormalizedAuthConfig {
  tokenProvider?: AuthConfig["tokenProvider"];
  tokenHeader: string;
  tokenPrefix: string;
}

export class ApiClient {
  private readonly config: NormalizedConfig;
  private readonly authConfig: NormalizedAuthConfig;
  private readonly cache = new Map<string, ApiCacheEntry<unknown>>();
  private readonly pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor(config: ApiConfig = {}, authConfig: AuthConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "",
      defaultHeaders: {
        Accept: "application/json",
        ...config.defaultHeaders,
      },
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      cache: {
        ttl: config.cache?.ttl ?? DEFAULT_CACHE_TTL,
        enabledByDefault: config.cache?.enabledByDefault ?? false,
      },
    };

    this.authConfig = {
      tokenProvider: authConfig.tokenProvider,
      tokenHeader: authConfig.tokenHeader ?? "Authorization",
      tokenPrefix: authConfig.tokenPrefix ?? "Bearer",
    };
  }

  async get<T>(endpoint: EndpointInput, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const normalizedEndpoint = this.toEndpointString(endpoint);
    const cacheKey = options.cacheKey ?? this.createCacheKey("GET", normalizedEndpoint);
    const shouldUseCache = options.useCache ?? this.config.cache.enabledByDefault;
    const ttl = options.cacheTTL ?? this.config.cache.ttl;

    if (shouldUseCache) {
      const cached = this.cache.get(cacheKey) as ApiCacheEntry<T> | undefined;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return {
          data: cached.data,
          status: cached.status,
          headers: cached.headers,
        };
      }
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)! as Promise<ApiResponse<T>>;
    }

    const requestPromise = this.makeRequest<T>(normalizedEndpoint, {
      ...options,
      method: "GET",
    });

    this.pendingRequests.set(cacheKey, requestPromise as Promise<ApiResponse<unknown>>);

    try {
      const response = await requestPromise;

      if (shouldUseCache && response.status === 200) {
        this.cache.set(cacheKey, {
          data: response.data,
          status: response.status,
          headers: response.headers,
          timestamp: Date.now(),
        });
      }

      return response;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post<T>(
    endpoint: EndpointInput,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "POST",
      ...this.withBody(data, options),
    });
  }

  async put<T>(
    endpoint: EndpointInput,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      ...this.withBody(data, options),
    });
  }

  async patch<T>(
    endpoint: EndpointInput,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      ...this.withBody(data, options),
    });
  }

  async delete<T>(
    endpoint: EndpointInput,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "DELETE",
      ...this.withBody(data, options),
    });
  }

  invalidateCache(target?: string) {
    if (!target) {
      this.cache.clear();
      return;
    }

    const normalized = this.toEndpointString(target);
    for (const key of this.cache.keys()) {
      if (key.includes(normalized)) {
        this.cache.delete(key);
      }
    }
  }

  clearPending() {
    this.pendingRequests.clear();
  }

  private createCacheKey(method: string, endpoint: string): string {
    return `${method.toUpperCase()}::${endpoint}`;
  }

  private toEndpointString(endpoint: EndpointInput): string {
    const resolved = typeof endpoint === "string" ? endpoint : resolveEndpoint(endpoint);

    if (resolved.startsWith("http")) {
      return resolved;
    }

    return resolved.startsWith("/") ? resolved : `/${resolved}`;
  }

  private buildUrl(endpoint: EndpointInput | string): string {
    const resolved = typeof endpoint === "string" ? this.toEndpointString(endpoint) : this.toEndpointString(endpoint);

    if (resolved.startsWith("http")) {
      return resolved;
    }

    return `${this.config.baseUrl}${resolved}`;
  }

  private async makeRequest<T>(
    endpoint: EndpointInput | string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const { useCache: _useCache, cacheKey: _cacheKey, cacheTTL: _cacheTTL, skipAuth, ...rest } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const requestOptions = await this.buildRequestOptions(rest, Boolean(skipAuth));

    const userSignal = requestOptions.signal;
    if (userSignal) {
      if (userSignal.aborted) {
        controller.abort();
      } else {
        const abort = () => controller.abort();
        userSignal.addEventListener("abort", abort, { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new ApiError("Request timeout", 408);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }

      throw new ApiError("Unknown error", 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async buildRequestOptions(
    options: RequestInit,
    skipAuth: boolean
  ): Promise<RequestInit> {
    const headers = new Headers(this.config.defaultHeaders);

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!skipAuth && this.authConfig.tokenProvider) {
      try {
        const token = await this.authConfig.tokenProvider();
        if (token) {
          const value = this.authConfig.tokenPrefix
            ? `${this.authConfig.tokenPrefix} ${token}`.trim()
            : token;
          headers.set(this.authConfig.tokenHeader, value);
        }
      } catch (error) {
        console.error("Failed to resolve auth token", error);
      }
    }

    const finalOptions: RequestInit = {
      ...options,
      headers,
    };

    return finalOptions;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        return (await response.json()) as T;
      } catch (error) {
        throw new ApiError("Invalid JSON response", response.status, response);
      }
    }

    const text = await response.text();
    return text as unknown as T;
  }

  private isAbortError(error: unknown): boolean {
    if (
      typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return true;
    }

    return error instanceof Error && error.name === "AbortError";
  }

  private withBody(
    data: unknown,
    options: RequestOptions
  ): Pick<RequestInit, "body" | "headers"> {
    if (data === undefined || data === null) {
      return {};
    }

    const headers = new Headers(options.headers ?? {});

    if (typeof data === "string") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain;charset=UTF-8");
      }
      return { body: data, headers };
    }

    if (this.isFormData(data) || this.isURLSearchParams(data)) {
      headers.delete("Content-Type");
      return { body: data as BodyInit, headers };
    }

    if (this.isBodyStream(data)) {
      return { body: data as BodyInit, headers };
    }

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return { body: JSON.stringify(data), headers };
  }

  private isFormData(value: unknown): value is FormData {
    return typeof FormData !== "undefined" && value instanceof FormData;
  }

  private isURLSearchParams(value: unknown): value is URLSearchParams {
    return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
  }

  private isBodyStream(value: unknown): value is BodyInit {
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return true;
    }

    if (typeof ArrayBuffer !== "undefined") {
      if (value instanceof ArrayBuffer) {
        return true;
      }

      if (ArrayBuffer.isView(value)) {
        return true;
      }
    }

    if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
      return true;
    }

    return false;
  }
}

// Client-side token provider
const getClientToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("auth_token");
};

// Server-side token provider stub (extend as needed)
const getServerToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined") return null;
  return null;
};

export const clientApi = new ApiClient(
  {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  },
  {
    tokenProvider: getClientToken,
  }
);

export const serverApi = new ApiClient(
  {
    baseUrl:
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  },
  {
    tokenProvider: getServerToken,
  }
);

export const api = typeof window === "undefined" ? serverApi : clientApi;

export type {
  ApiConfig,
  ApiResponse,
  AuthConfig,
  RequestOptions,
  QueryParams,
  EndpointDescriptor,
  EndpointInput,
} from "./types";

export { endpoints, resolveEndpoint } from "./endpoints";
export { handleApiError, isApiError } from "./error-handler";
