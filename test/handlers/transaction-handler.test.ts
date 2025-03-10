import { handleTransactionInputs } from "@handlers/transaction-handler";
import inquirer from "inquirer";
import chalk from "chalk";

jest.mock("inquirer");
jest.mock("chalk", () => ({
  red: jest.fn((str) => str),
  green: jest.fn((str) => str),
}));

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
let mockConsoleLog: jest.SpyInstance;

const mockTransactionService = {
  generateTransactionID: jest.fn(),
  process: jest.fn(),
};

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

  test("when input format is invalid, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid transaction input");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid transaction input");
    expect(result).toBe(true);
  });

  test("when date format is invalid, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "2024-03-21 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date format. Use YYYYMMdd");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid date format. Use YYYYMMdd");
  });

  test("when date is over the end of month, should show error ", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240231 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid date");
  });

  test("when transaction type is invalid, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 X 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    const errorMessage = "Invalid transaction type. Valid types are 'D' for Deposit or 'W' for Withdrawal.";
    expect(chalk.red).toHaveBeenCalledWith(errorMessage);
    expect(mockConsoleLog).toHaveBeenCalledWith(errorMessage);
  });

  test("when amount is not a number, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D abc" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid amount");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid amount");
  });

  test("when amount is zero or negative, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 0" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Amount must be greater than 0");
    expect(mockConsoleLog).toHaveBeenCalledWith("Amount must be greater than 0");
  });

  test("when amount exceeds limit, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 1000001" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Amount must not exceed 1,000,000");
    expect(mockConsoleLog).toHaveBeenCalledWith("Amount must not exceed 1,000,000");
  });

  test("when amount has more than 2 decimal places, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100.123" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Amount can have up to 2 decimal places");
    expect(mockConsoleLog).toHaveBeenCalledWith("Amount can have up to 2 decimal places");
  });

  test("when transaction processing throws Result error, should show error message", async () => {
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      "20240321-01"
    );
    mockTransactionService.process.mockRejectedValueOnce({
      errorMessage: "Result error message",
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith({"errorMessage": "Result error message"});
    expect(mockConsoleLog).toHaveBeenCalledWith({"errorMessage": "Result error message"});
    expect(chalk.red).toHaveBeenCalledWith("Failed to process transaction!");
    expect(mockConsoleLog).toHaveBeenCalledWith("Failed to process transaction!");
  });

  test("when transaction processing throws Error object, should show error message", async () => {
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      "20240321-01"
    );
    mockTransactionService.process.mockRejectedValueOnce(
      new Error("Custom error message")
    );

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    const error = new Error("Custom error message");
    expect(chalk.red).toHaveBeenCalledWith(error);
    expect(mockConsoleLog).toHaveBeenCalledWith(error);
    expect(chalk.red).toHaveBeenCalledWith("Failed to process transaction!");
    expect(mockConsoleLog).toHaveBeenCalledWith("Failed to process transaction!");
  });

  test("when transaction processing throws unknown error type, should show generic message", async () => {
    mockTransactionService.generateTransactionID.mockResolvedValueOnce(
      "20240321-01"
    );
    mockTransactionService.process.mockRejectedValueOnce("Unknown error");

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 ACC001 D 100" })
      .mockResolvedValueOnce({ input: "" });

    await handleTransactionInputs();

    expect(chalk.red).toHaveBeenCalledWith("Unknown error");
    expect(mockConsoleLog).toHaveBeenCalledWith("Unknown error");
    expect(chalk.red).toHaveBeenCalledWith("Failed to process transaction!");
    expect(mockConsoleLog).toHaveBeenCalledWith("Failed to process transaction!");
  });

  test("when transaction processing returns with error, should show error message and continue", async () => {
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
