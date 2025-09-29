"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "auth_token";

type SetTokenFn = (value: string | null) => void;

interface UseAuthToken {
  token: string | null;
  setToken: SetTokenFn;
  clearToken: () => void;
}

export const useAuthToken = (): UseAuthToken => {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = window.localStorage.getItem(STORAGE_KEY);
    setTokenState(storedToken);
  }, []);

  const setToken = useCallback<SetTokenFn>((value) => {
    if (typeof window === "undefined") {
      return;
    }

    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => setToken(null), [setToken]);

  return {
    token,
    setToken,
    clearToken,
  };
};

export const useAuthHeaders = () => {
  const { token } = useAuthToken();

  return useMemo(() => {
    if (!token) {
      return {} as Record<string, string>;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);
};
