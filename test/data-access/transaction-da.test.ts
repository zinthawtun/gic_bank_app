import { TransactionDA } from "@data-access/transaction-da";

import { Transaction } from "@models/transaction";

import {
  createSuccessfulResult,
  createErrorResult,
} from "@utilities/result-helper";

import { FileService } from "@infrastructure/file-service";
import { createTransaction } from "@test/scenario-helper";

const mockFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

jest.mock("@infrastructure/file-service", () => ({
  FileService: jest.fn().mockImplementation(() => mockFileService),
}));

describe("TransactionDA_Test", () => {
  let transactionDA: TransactionDA;
  const testFilePath = "@data/transactions.json";
  const mockTransactions: Transaction[] = [
    createTransaction(
      "20240320-01",
      new Date("2024-03-20"),
      "Account1",
      "D",
      100
    ),
    createTransaction(
      "20240321-01",
      new Date("2024-03-21"),
      "Account2",
      "W",
      50
    ),
    createTransaction(
      "20240322-01",
      new Date("2024-03-22"),
      "Account1",
      "D",
      75
    ),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();

    mockFileService.readFile.mockResolvedValue(mockTransactions);
    mockFileService.writeFile.mockResolvedValue(undefined);

    transactionDA = new TransactionDA(new FileService());
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("getTransactionByAccountID_test", () => {
    test("when accountID is empty, test should return undefined", async () => {
      const result = await transactionDA.getTransactionsByAccountID("");
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is null, test should return undefined", async () => {
      const result = await transactionDA.getTransactionsByAccountID(
        null as any
      );
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is undefined, test should return undefined", async () => {
      const result = await transactionDA.getTransactionsByAccountID(
        undefined as any
      );
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when there is no transaction for the accountID, test should return empty array", async () => {
      const expected: Transaction[] = [];
      const result = await transactionDA.getTransactionsByAccountID("Account3");
      expect(result).toEqual(expected);
      expect(mockFileService.readFile).toHaveBeenCalledTimes(1);
    });

    test("when accountID is found, test should return the transactions", async () => {
      const expectedMock = mockTransactions.filter(
        (t) => t.accountID === "Account1"
      );
      const result = await transactionDA.getTransactionsByAccountID("Account1");
      expect(result).toEqual(expectedMock);
      expect(mockFileService.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("addTransaction_test", () => {
    test("when transaction is null, test should return error message", async () => {
      const result = await transactionDA.addTransaction(null as any);
      const mockError = new Error("Invalid transaction");

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).not.toHaveBeenCalled();
    });

    test("when transaction accountID is empty, test should return error message", async () => {
      const newTransaction = { ...mockTransactions[0], accountID: "" };
      const result = await transactionDA.addTransaction(newTransaction);
      const mockError = new Error("Invalid transaction");

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).not.toHaveBeenCalled();
    });

    test("when transaction amount is negative, test should return error message", async () => {
      const newTransaction = { ...mockTransactions[0], amount: -100 };
      const result = await transactionDA.addTransaction(newTransaction);
      const mockError = new Error("Invalid transaction");

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).not.toHaveBeenCalled();
    });

    test("when transaction is valid, test should return successful message", async () => {
      const newTransaction: Transaction = {
        accountID: "Account2",
        amount: 100,
        date: new Date("2024-03-22"),
        transactionID: "20240323-02",
        type: "D",
      };
      const updatedTransactions: Transaction[] = [
        ...mockTransactions,
        newTransaction,
      ];
      const result = await transactionDA.addTransaction(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedTransactions
      );
    });

    test("when transaction already exists, test should return error message", async () => {
      const newTransaction = { ...mockTransactions[0] };
      const result = await transactionDA.addTransaction(newTransaction);
      const mockError = new Error("Transaction already exists");

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).not.toHaveBeenCalled();
    });

    test("when file write fails, test should return false", async () => {
      const mockError = new Error("File write error");
      mockFileService.readFile.mockResolvedValue([...mockTransactions]);
      mockFileService.writeFile.mockRejectedValueOnce(mockError);
      const newTransaction: Transaction = {
        accountID: "Account2",
        amount: 100,
        date: new Date("2024-03-22"),
        transactionID: "20240323-05",
        type: "D",
      };
      const result = await transactionDA.addTransaction(newTransaction);

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).toHaveBeenCalledWith(testFilePath, [
        ...mockTransactions,
        newTransaction,
      ]);
    });
  });
});
