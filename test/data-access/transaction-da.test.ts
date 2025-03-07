import { Transaction } from "@models/transaction";
import { TransactionDA } from "@data-access/transaction-da";
import { FileService } from "@infrastructure/file-service";
import {
  createSuccessfulResult,
  createCustomErrorResult,
  createErrorResult,
} from "@utilities/result-helper";

const mockFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};

jest.mock("@infrastructure/file-service", () => ({
  FileService: jest.fn().mockImplementation(() => mockFileService),
}));

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("TransactionDA_Test", () => {
  let transactionDA: TransactionDA;
  const testFilePath = "@data/transactions.json";
  const mockTransactions: Transaction[] = [
    {
      transactionID: "20240320-01",
      transactionDate: new Date("2024-03-20"),
      accountID: "acc1",
      type: "D",
      amount: 100,
    },
    {
      transactionID: "20240321-01",
      transactionDate: new Date("2024-03-21"),
      accountID: "acc2",
      type: "W",
      amount: 50,
    },
    {
      transactionID: "20240322-01",
      transactionDate: new Date("2024-03-22"),
      accountID: "acc1",
      type: "D",
      amount: 75,
    },
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
      const result = await transactionDA.getTransactionByAccountID("");
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is null, test should return undefined", async () => {
      const result = await transactionDA.getTransactionByAccountID(null as any);
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is undefined, test should return undefined", async () => {
      const result = await transactionDA.getTransactionByAccountID(
        undefined as any
      );
      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when there is no transaction for the accountID, test should return empty array", async () => {
      const expected: Transaction[] = [];
      const result = await transactionDA.getTransactionByAccountID("acc3");
      expect(result).toEqual(expected);
      expect(mockFileService.readFile).toHaveBeenCalledTimes(1);
    });

    test("when accountID is found, test should return the transactions", async () => {
      const expectedMock = mockTransactions.filter(
        (t) => t.accountID === "acc1"
      );
      const result = await transactionDA.getTransactionByAccountID("acc1");
      expect(result).toEqual(expectedMock);
      expect(mockFileService.readFile).toHaveBeenCalledTimes(1);
    });

    test("when file read fails, test should throw error", async () => {
      mockFileService.readFile.mockRejectedValueOnce(
        new Error("File read error")
      );
      await expect(
        transactionDA.getTransactionByAccountID("acc1")
      ).rejects.toThrow("File read error");
    });
  });

  describe("getTransactions_test", () => {
    test("when file is empty, test should return empty array", async () => {
      mockFileService.readFile.mockResolvedValueOnce([]);
      const transactions = await (transactionDA as any).getTransactions();
      expect(transactions).toEqual([]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("successfully read all transactions from file", async () => {
      const transactions = await (transactionDA as any).getTransactions();
      expect(transactions).toEqual(mockTransactions);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("should throw error when file read fails", async () => {
      mockFileService.readFile.mockRejectedValueOnce(
        new Error("File read error")
      );
      await expect((transactionDA as any).getTransactions()).rejects.toThrow(
        "File read error"
      );
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
        accountID: "acc2",
        amount: 100,
        transactionDate: new Date("2024-03-22"),
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

    test("when file write fails, test should return false", async () => {
      const mockError = new Error("File write error");
      mockFileService.writeFile.mockRejectedValueOnce(mockError);
      const result = await transactionDA.addTransaction(mockTransactions[0]);

      expect(result).toEqual(createErrorResult(mockError));
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        mockTransactions
      );
    });
  });

  describe("saveTransactions_test", () => {
    test("when file write fails with non-Error type, return unknown error", async () => {
      mockFileService.writeFile.mockRejectedValueOnce("string error");
      const result = await (transactionDA as any).saveTransactions(
        mockTransactions
      );

      expect(result).toEqual(createCustomErrorResult("Unknown error occurred"));
    });

    test("when file write fails with Error type, return error message", async () => {
      const mockError = new Error("File write error");
      mockFileService.writeFile.mockRejectedValueOnce(mockError);
      const result = await (transactionDA as any).saveTransactions(
        mockTransactions
      );

      expect(result).toEqual(createErrorResult(mockError));
    });

    test("when file write succeeds, test should return true", async () => {
      const result = await (transactionDA as any).saveTransactions(
        mockTransactions
      );

      expect(result).toEqual(createSuccessfulResult());
    });
  });
});
