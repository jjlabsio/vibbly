export type TokenProvider = () => Promise<string | null> | string | null;

export interface AuthConfig {
  tokenProvider?: TokenProvider;
  tokenHeader?: string;
  tokenPrefix?: string;
}

export interface ApiCacheSettings {
  ttl?: number;
  enabledByDefault?: boolean;
}

export interface ApiConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  cache?: ApiCacheSettings;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiCacheEntry<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  timestamp: number;
}

export interface RequestOptions extends RequestInit {
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  skipAuth?: boolean;
}

export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryParamValue>;

export interface EndpointDescriptor {
  path: string;
  query?: QueryParams;
}

export type EndpointInput = string | EndpointDescriptor;
