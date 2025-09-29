import { ApiError } from "./index";

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "잘못된 요청입니다.";
      case 401:
        return "로그인이 필요합니다.";
      case 403:
        return "권한이 없습니다.";
      case 404:
        return "요청한 리소스를 찾을 수 없습니다.";
      case 408:
        return "요청 시간이 초과되었습니다.";
      case 500:
        return "서버에 문제가 발생했습니다.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message || DEFAULT_ERROR_MESSAGE;
  }

  return DEFAULT_ERROR_MESSAGE;
};

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
