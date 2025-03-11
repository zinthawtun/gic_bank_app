import inquirer from "inquirer";
import chalk from "chalk";

import { createTransaction } from "@test/scenario-helper";
import { createCustomErrorResult } from "@/utilities/result-helper";

import { handleStatementInputs } from "@handlers/statement-handler";

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
const mockReportService = {
  runReport: jest.fn(),
};
let mockConsoleLog: jest.SpyInstance;
let mockConsoleTable: jest.SpyInstance;

jest.mock("inquirer");
jest.mock("chalk", () => ({
  red: jest.fn((str) => str),
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
}));
jest.mock("@services/report-service", () => ({
  ReportService: jest.fn().mockImplementation(() => mockReportService),
}));

describe("handleStatementInputs_Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    mockConsoleTable = jest.spyOn(console, "table").mockImplementation();
    mockInquirer.prompt.mockResolvedValue({ input: "" });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleTable.mockRestore();
  });

  test("when input is empty, should exit", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "" });

    const result = await handleStatementInputs();

    expect(result).toBe(true);
  });

  test("when input format is invalid, return input format error", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001" });

    const result = await handleStatementInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid statement input");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid statement input");
    expect(result).toBe(true);
  });

  test("when date format is invalid, return date format error", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 2024-03" });

    const result = await handleStatementInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date format. Use YYYYMM");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Invalid date format. Use YYYYMM"
    );
    expect(result).toBe(true);
  });

  test("when date is invalid, return invalid date error", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202413" });

    const result = await handleStatementInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid date");
    expect(result).toBe(true);
  });

  test("when no transactions found, return transaction not found message", async () => {
    mockReportService.runReport.mockResolvedValueOnce({
      transactions: [],
      result: { hasError: false },
    });

    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(mockReportService.runReport).toHaveBeenCalledWith(
      "ACC001",
      new Date(Date.UTC(2024, 2, 1))
    );
    expect(chalk.red).toHaveBeenCalledWith("No transactions found");
    expect(mockConsoleLog).toHaveBeenCalledWith("No transactions found");
    expect(result).toBe(true);
  });

  test("when report service throws error, return error message", async () => {
    mockReportService.runReport.mockRejectedValueOnce(
      new Error("Service error")
    );

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "ACC001 202403" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleStatementInputs();

    expect(mockReportService.runReport).toHaveBeenCalledWith(
      "ACC001",
      new Date(Date.UTC(2024, 2, 1))
    );
    expect(chalk.red).toHaveBeenCalledWith("Error generating statement:");
    expect(mockConsoleLog).toHaveBeenCalledWith("Error generating statement:");
    expect(mockConsoleLog).toHaveBeenCalledWith("Service error");
    expect(result).toBe(true);
  });

  test("when transactions exist without interest, should print statement", async () => {
    const mockTransactions = [
      {
        transaction: {
          transactionID: "20240301-01",
          date: new Date(Date.UTC(2024, 2, 1)),
          accountID: "ACC001",
          type: "D",
          amount: 100,
        },
        balance: 100,
      },
    ];

    mockReportService.runReport.mockResolvedValueOnce({
      transactions: mockTransactions,
      result: { hasError: false },
    });

    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(mockReportService.runReport).toHaveBeenCalledWith(
      "ACC001",
      new Date(Date.UTC(2024, 2, 1))
    );

    expect(chalk.yellow).toHaveBeenCalledWith("Account: ACC001");

    const expectedTableData = [
      {
        Date: "20240301",
        "Txn Id": "20240301-01",
        Type: "D",
        Amount: "100.00",
        Balance: "100.00",
      },
    ];
    expect(mockConsoleTable).toHaveBeenCalledWith(expectedTableData);
    expect(result).toBe(true);
  });

  test("when transactions exist with interest, should print statement with interest", async () => {
    const mockTransactions = [
      {
        transaction: {
          transactionID: "20240301-01",
          date: new Date(Date.UTC(2024, 2, 1)),
          accountID: "ACC001",
          type: "D",
          amount: 100,
        },
        balance: 100,
      },
    ];

    const mockInterest = {
      accountID: "ACC001",
      date: new Date(Date.UTC(2024, 2, 31)),
      type: "I",
      amount: 0.82,
    };

    mockReportService.runReport.mockResolvedValueOnce({
      transactions: mockTransactions,
      calculatedAccountInterest: mockInterest,
      result: { hasError: false },
    });

    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(mockReportService.runReport).toHaveBeenCalledWith(
      "ACC001",
      new Date(Date.UTC(2024, 2, 1))
    );

    expect(chalk.yellow).toHaveBeenCalledWith("Account: ACC001");

    const expectedTableData = [
      {
        Date: "20240301",
        "Txn Id": "20240301-01",
        Type: "D",
        Amount: "100.00",
        Balance: "100.00",
      },
      {
        Date: "20240331",
        "Txn Id": "",
        Type: "I",
        Amount: "0.82",
        Balance: "100.82",
      },
    ];
    expect(mockConsoleTable).toHaveBeenCalledWith(expectedTableData);
    expect(result).toBe(true);
  });

  test("when Error objects thrown, message should be returned properly", async () => {
    const errorMessage = "Test error message";
    mockReportService.runReport.mockRejectedValue(new Error(errorMessage));
    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(result).toBe(true);
    expect(chalk.red).toHaveBeenCalledWith("Error generating statement:");
    expect(mockConsoleLog).toHaveBeenCalledWith("Error generating statement:");
    expect(mockConsoleLog).toHaveBeenCalledWith(errorMessage);
  });

  test("when string error is thrown, ", async () => {
    const errorMessage = "Custom error object";
    mockReportService.runReport.mockRejectedValue(errorMessage);
    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(result).toBe(true);
    expect(chalk.red).toHaveBeenCalledWith("Error generating statement:");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage)
    );
  });

  test("when report service returns result with error, return error message", async () => {
    const errorMessage = "Custom error message";
    mockReportService.runReport.mockResolvedValueOnce({
      transactions: [
        {
          transaction: createTransaction(
            "20240301-01",
            new Date(Date.UTC(2024, 2, 1)),
            "ACC001",
            "D",
            100
          ),
          balance: 100,
        },
      ],
      result: createCustomErrorResult(errorMessage),
    });

    mockInquirer.prompt.mockResolvedValueOnce({ input: "ACC001 202403" });

    const result = await handleStatementInputs();

    expect(mockReportService.runReport).toHaveBeenCalledWith(
      "ACC001",
      new Date(Date.UTC(2024, 2, 1))
    );
    expect(chalk.red).toHaveBeenCalledWith(errorMessage);
    expect(mockConsoleLog).toHaveBeenCalledWith(errorMessage);
    expect(result).toBe(true);
  });
});
