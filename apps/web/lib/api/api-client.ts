import { ApiConfig, ApiError, ApiResponse } from "./types";

// https://dev.to/dmitrevnik/fetch-wrapper-for-nextjs-a-deep-dive-into-best-practices-53dh

export class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "",
      defaultHeaders: {
        "Content-Type": "application/json",
        ...config.defaultHeaders,
      },
      timeout: config.timeout || 10000,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Here's the key: we check the status and throw for errors
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      // Parse JSON safely
      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
    }
  }

  private buildUrl(endpoint: string): string {
    // Handle both absolute and relative URLs
    if (endpoint.startsWith("http")) {
      return endpoint;
    }
    return `${this.config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }

  private buildRequestOptions(options: RequestInit): RequestInit {
    const headers = new Headers(this.config.defaultHeaders);

    if (options.headers) {
      const requestHeaders = new Headers(options.headers as HeadersInit);
      requestHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const body = options.body;
    if (this.isFormData(body)) {
      headers.delete("Content-Type");
    }

    return {
      ...options,
      headers: Object.fromEntries(headers.entries()),
    };
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        throw new ApiError("Invalid JSON response", response.status, response);
      }
    }

    // Handle text responses
    return (await response.text()) as unknown as T;
  }

  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: this.prepareBody(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: this.prepareBody(data),
    });
  }

  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: "DELETE" });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: this.prepareBody(data),
    });
  }

  private prepareBody(data: unknown): BodyInit | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }

    if (this.isFormData(data)) {
      return data;
    }

    if (
      typeof Blob !== "undefined" && data instanceof Blob
    ) {
      return data;
    }

    if (
      typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer
    ) {
      return data;
    }

    if (data instanceof URLSearchParams) {
      return data;
    }

    if (typeof data === "string" || data instanceof String) {
      return data.toString();
    }

    return JSON.stringify(data);
  }

  private isFormData(
    body: unknown
  ): body is FormData {
    return typeof FormData !== "undefined" && body instanceof FormData;
  }
}
