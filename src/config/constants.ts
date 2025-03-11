export enum TransactionType {
  DEPOSIT = "D",
  WITHDRAWAL = "W",
}

export enum IDType {
  ACCOUNT = 1,
  INTEREST = 2,
}

export enum MenuOption {
  TRANSACTIONS = "T",
  INTEREST_RULES = "I",
  PRINT_STATEMENT = "P",
  QUIT = "Q",
}

export const TransactionConfig = {
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT: 0,
  MAX_DECIMAL_PLACES: 2,
  DATE_FORMAT: "YYYYMMdd",
} as const;

export const ValidationMessages = {
  INVALID_DATE_FORMAT: "Invalid date format. Use YYYYMMdd",
  INVALID_DATE: "Invalid date",
  INVALID_AMOUNT: "Invalid amount",
  INVALID_DECIMAL_PLACES: "Amount can have up to 2 decimal places",
  AMOUNT_TOO_SMALL: "Amount must be greater than 0",
  AMOUNT_TOO_LARGE: "Amount must not exceed 1,000,000",
  INVALID_TRANSACTION_TYPE: 'Invalid transaction type. Valid types are "D" for Deposit or "W" for Withdrawal.',
  INVALID_MENU_CHOICE: "Invalid choice. Please enter T, I, P, or Q",
  INVALID_ACCOUNT_ID_LENGTH: "Account name must be less than 21 characters",
  INVALID_INTEREST_ID_LENGTH: "Interest rule name must be less than 21 characters",
} as const;
