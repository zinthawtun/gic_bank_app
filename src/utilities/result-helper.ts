import { Result } from "@models/result";

export function createSuccessfulResult(): Result {
  return {
    hasError: false,
    errorMessage: undefined,
  };
}

export function createErrorResult(error: unknown): Result {
  if (error instanceof Error) {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }
  return {
    hasError: true,
    errorMessage: "Unknown error occurred",
  };
}

export function createCustomErrorResult(message: string): Result {
  return {
    hasError: true,
    errorMessage: message,
  };
}
