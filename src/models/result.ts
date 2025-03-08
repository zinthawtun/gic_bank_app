export interface Result {
  isSuccess: boolean;
  hasError: boolean;
  errorMessage: string | undefined;
}

export interface ValidationError {
  isValid: boolean;
  errorMessage: string;
}