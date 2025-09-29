import { ApiClient } from "./api-client";

// Client-side token provider (browser only)
const getClientToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

// Server-side token provider (for SSR)
const getServerToken = (): string | null => {
  // In server components, you might get tokens from cookies
  // This is a simplified example - in practice, you'd use Next.js headers()
  return null;
};

// Create different instances for different contexts
export const clientApi = new ApiClient(
  {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  }
  //   {
  //     tokenProvider: getClientToken,
  //   }
);

export const serverApi = new ApiClient(
  {
    baseUrl:
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000/api",
  }
  //   {
  //     tokenProvider: getServerToken,
  //   }
);

// For convenience, export a context-aware API
export const api = typeof window === "undefined" ? serverApi : clientApi;
