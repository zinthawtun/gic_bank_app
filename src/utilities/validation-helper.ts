import {
  IDType,
  TransactionConfig,
  ValidationMessages,
  TransactionType
} from "@config/constants";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validateDate = (date: string): Date => {
  if (!/^\d{8}$/.test(date)) {
    throw new ValidationError(ValidationMessages.INVALID_DATE_FORMAT);
  }

  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6)) - 1;
  const day = parseInt(date.substring(6, 8));
  const effectiveDate = new Date(Date.UTC(year, month, day));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getDate();

  if (
    isNaN(effectiveDate.getTime()) ||
    day > lastDayOfMonth ||
    day <= 0 ||
    month < 0 ||
    month > 11
  ) {
    throw new ValidationError(ValidationMessages.INVALID_DATE);
  }

  return effectiveDate;
};

export const validateAmount = (amount: string): number => {
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount)) {
    throw new ValidationError(ValidationMessages.INVALID_AMOUNT);
  }

  if (!/^\d+(\.\d{0,2})?$/.test(amount)) {
    throw new ValidationError(ValidationMessages.INVALID_DECIMAL_PLACES);
  }

  if (parsedAmount <= TransactionConfig.MIN_AMOUNT) {
    throw new ValidationError(ValidationMessages.AMOUNT_TOO_SMALL);
  }

  if (parsedAmount > TransactionConfig.MAX_AMOUNT) {
    throw new ValidationError(ValidationMessages.AMOUNT_TOO_LARGE);
  }

  return parsedAmount;
};

export const validateTransactionType = (type: string): TransactionType => {
  if (type !== TransactionType.DEPOSIT && type !== TransactionType.WITHDRAWAL) {
    throw new ValidationError(ValidationMessages.INVALID_TRANSACTION_TYPE);
  }
  return type as TransactionType;
};

export const validateInputID = (inputID: string, type: IDType): string => {
  if (inputID.length > 20) {
    if (type === IDType.ACCOUNT) {
      throw new ValidationError(ValidationMessages.INVALID_ACCOUNT_ID_LENGTH);
    } else {
      throw new ValidationError(ValidationMessages.INVALID_INTEREST_ID_LENGTH);
    }
  }

  return inputID;
};
