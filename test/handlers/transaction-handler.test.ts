import inquirer from "inquirer";
import chalk from "chalk";

import { ValidationMessages } from "@config/constants";

import { handleTransactionInputs } from "@handlers/transaction-handler";

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
const mockTransactionService = {
  generateTransactionID: jest.fn(),
  process: jest.fn(),
};
let mockConsoleLog: jest.SpyInstance;

jest.mock("inquirer");
jest.mock("chalk", () => ({
  red: jest.fn((str) => str),
  green: jest.fn((str) => str),
}));
jest.mock("@services/transaction-service", () => ({
  TransactionService: jest
    .fn()
    .mockImplementation(() => mockTransactionService),
}));

describe("handleTransactionInputs_Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    mockInquirer.prompt.mockResolvedValue({ input: "" });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  test("when input is empty, should exit", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(result).toBe(true);
  });

  test("when input format is invalid, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid transaction input format");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Invalid transaction input format"
    );
    expect(result).toBe(true);
  });

  test("when date format is invalid, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "2024-03-21 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE_FORMAT
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE_FORMAT
    );
    expect(result).toBe(true);
  });

  test("when date is over the end of month, return error ", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240231 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(ValidationMessages.INVALID_DATE);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE
    );
    expect(result).toBe(true);
  });

  test("when account name is longer than 20 characters, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({
        input: "20240321 AccountNameLongerThan21Chars D 100",
      })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      ValidationMessages.INVALID_ACCOUNT_ID_LENGTH
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_ACCOUNT_ID_LENGTH
    );
    expect(result).toBe(true);
  });

  test("when transaction type is invalid, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 X 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    const errorMessage = ValidationMessages.INVALID_TRANSACTION_TYPE;
    expect(chalk.red).toHaveBeenCalledWith(errorMessage);
    expect(mockConsoleLog).toHaveBeenCalledWith(errorMessage);
    expect(result).toBe(true);
  });

  test("when amount is not a number, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D abc" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(ValidationMessages.INVALID_AMOUNT);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_AMOUNT
    );
    expect(result).toBe(true);
  });

  test("when amount is zero or negative, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 0" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(ValidationMessages.AMOUNT_TOO_SMALL);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.AMOUNT_TOO_SMALL
    );
    expect(result).toBe(true);
  });

  test("when amount exceeds limit, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 1000001" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(ValidationMessages.AMOUNT_TOO_LARGE);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.AMOUNT_TOO_LARGE
    );
    expect(result).toBe(true);
  });

  test("when amount has more than 2 decimal places, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100.123" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DECIMAL_PLACES
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DECIMAL_PLACES
    );
    expect(result).toBe(true);
  });

  test("when transaction processing throws Result error, return error message", async () => {
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      "20240321-01"
    );
    mockTransactionService.process.mockRejectedValueOnce({
      errorMessage:
        "An unexpected error occurred while processing the transaction",
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the transaction"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the transaction"
    );
    expect(result).toBe(true);
  });

  test("when eerror instanceof Error, return error message", async () => {
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      "20240321-01"
    );
    mockTransactionService.process.mockRejectedValueOnce(
      new Error("An unexpected error occurred while processing the transaction")
    );

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the transaction"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the transaction"
    );
    expect(result).toBe(true);
  });

  test("when transaction processing returns with error, return error message and continue", async () => {
    const mockTransactionId = "20240321-01";
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      mockTransactionId
    );
    mockTransactionService.process.mockResolvedValueOnce({
      hasError: true,
      errorMessage: "Insufficient funds",
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 W 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(mockTransactionService.generateTransactionID).toHaveBeenCalledWith(
      expect.any(Date),
      "ACC001"
    );
    expect(mockTransactionService.process).toHaveBeenCalledWith({
      transactionID: mockTransactionId,
      date: expect.any(Date),
      accountID: "ACC001",
      type: "W",
      amount: 100,
    });

    expect(mockConsoleLog).toHaveBeenCalledWith("Insufficient funds");
    expect(result).toBe(true);
  });

  test("when transaction is valid, should process successfully and return true", async () => {
    const mockTransactionId = "20240321-01";
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      mockTransactionId
    );
    mockTransactionService.process.mockResolvedValueOnce({ hasError: false });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(mockTransactionService.generateTransactionID).toHaveBeenCalledWith(
      expect.any(Date),
      "ACC001"
    );
    expect(mockTransactionService.process).toHaveBeenCalledWith({
      transactionID: mockTransactionId,
      date: expect.any(Date),
      accountID: "ACC001",
      type: "D",
      amount: 100,
    });
    expect(chalk.green).toHaveBeenCalledWith("Transaction successful!");
    expect(mockConsoleLog).toHaveBeenCalledWith("Transaction successful!");
    expect(result).toBe(true);
  });
});
