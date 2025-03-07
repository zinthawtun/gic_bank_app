import { Result } from "../models/result";

export function createSuccessfulResult(): Result {
  return {
    isSuccess: true,
    hasError: false,
    errorMessage: undefined,
  };
}

export function createErrorResult(error: unknown): Result {
  if (error instanceof Error) {
    return {
      isSuccess: false,
      hasError: true,
      errorMessage: error.message,
    };
  }
  return {
    isSuccess: false,
    hasError: true,
    errorMessage: "Unknown error occurred",
  };
}

export function createCustomErrorResult(message: string): Result {
  return {
    isSuccess: false,
    hasError: true,
    errorMessage: message,
  };
}
