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
    return {
      ...options,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers,
      },
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
      body: data ? JSON.stringify(data) : undefined,
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
      body: data ? JSON.stringify(data) : undefined,
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
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
