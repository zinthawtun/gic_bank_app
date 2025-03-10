import { Account } from "@/models/account";
import { Transaction } from "@/models/transaction";
import { AccountDA } from "@data-access/account-da";
import { TransactionDA } from "@data-access/transaction-da";

import {
  createCustomErrorResult,
  createErrorResult,
  createSuccessfulResult,
} from "@utilities/result-helper";

import { TransactionService } from "@/services/transaction-service";

import { FileService } from "@/infrastructure/file-service";

import { createAccount, createTransaction } from "@test/scenario-helper";

const mockAccountDA = {
  getAccountByID: jest.fn(),
  createNewAccount: jest.fn(),
  updateAccount: jest.fn(),
};
const mockTransactionDA = {
  addTransaction: jest.fn(),
  getTransactionsByAccountID: jest.fn(),
};

jest.mock("@data-access/account-da", () => ({
  AccountDA: jest.fn().mockImplementation(() => mockAccountDA),
}));

jest.mock("@data-access/transaction-da", () => ({
  TransactionDA: jest.fn().mockImplementation(() => mockTransactionDA),
}));

describe("TransactionService_Test", () => {
  let transactionService: TransactionService;
  const mockAccounts: Account[] = [
    {
      accountID: "Account01",
      balance: 100,
    },
    {
      accountID: "Account02",
      balance: 200,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountDA.getAccountByID.mockResolvedValue(undefined);
    mockAccountDA.createNewAccount.mockResolvedValue(createSuccessfulResult());
    mockAccountDA.updateAccount.mockResolvedValue(createSuccessfulResult());
    mockTransactionDA.addTransaction.mockResolvedValue(
      createSuccessfulResult()
    );
    mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

    transactionService = new TransactionService(
      new AccountDA(new FileService()),
      new TransactionDA(new FileService())
    );
  });

  describe("process_test", () => {
    test("when account is not found and trying to withdraw before any deposits, should return error", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account03",
        "W",
        100
      );
      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
    });

    test("when trying to withdraw with insufficient with backdate transaction, should return error", async () => {
      const existingTransactions = [
        createTransaction(
          "20240320-01",
          new Date("2024-03-20"),
          "Account01",
          "D",
          100
        ),
      ];
      const newTransaction: Transaction = createTransaction(
        "20240319-01",
        new Date("2024-03-19"),
        "Account01",
        "W",
        50
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        existingTransactions
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(
        createCustomErrorResult("Cannot process transaction in the past")
      );
    });

    test("when withdrawing with sufficient historical balance, should succeed", async () => {
      const existingTransactions = [
        createTransaction(
          "20240319-01",
          new Date("2024-03-19"),
          "Account01",
          "D",
          200
        ),
      ];
      const mockAccount = createAccount("Account01", 200);
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        150
      );
      const updatedAccount: Account = createAccount(
        newTransaction.accountID,
        mockAccount.balance - newTransaction.amount
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccount);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        existingTransactions
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(
        newTransaction
      );
      expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
    });

    test("when account is not found, withdrawal transaction should return error", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account03",
        "W",
        100
      );
      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
    });

    test("when account is not found, it should create a new account, execute the deposit transaction, and update the account balance", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account03",
        "D",
        100
      );
      const newAccount: Account = createAccount(newTransaction.accountID, 0);
      const updatedAccount: Account = createAccount(
        newTransaction.accountID,
        newTransaction.amount
      );

      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockAccountDA.createNewAccount.mockResolvedValue(
        createSuccessfulResult()
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockAccountDA.getAccountByID).toHaveBeenCalledWith(
        newTransaction.accountID
      );
      expect(mockAccountDA.createNewAccount).toHaveBeenCalledWith({
        ...newAccount,
      });
      expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(
        newTransaction
      );
      expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
    });

    test("when account is not found, new account is created, transaction withdrawal should return error if balance is insufficient", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account03",
        "W",
        100
      );
      const newAccount: Account = createAccount(newTransaction.accountID, 0);

      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockAccountDA.createNewAccount.mockResolvedValue(
        createSuccessfulResult()
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
    });

    test("when account is not found, creating account has error and return error", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account03",
        "D",
        100
      );
      const newAccount: Account = createAccount(newTransaction.accountID, 0);

      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockAccountDA.createNewAccount.mockResolvedValue(
        createErrorResult("Invalid operation")
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createErrorResult("Invalid operation"));
    });

    test("when account is found, withdrawal insufficient amount should return error", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        200
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
    });

    test("when account is found, withdrawal sufficient amount should return success", async () => {
      const existingTransactions = [
        createTransaction(
          "20240319-01",
          new Date("2024-03-19"),
          "Account01",
          "D",
          150
        ),
      ];
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        50
      );
      const updatedAccount: Account = createAccount(
        newTransaction.accountID,
        mockAccounts[0].balance - newTransaction.amount
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        existingTransactions
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(
        newTransaction
      );
      expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
    });

    test("when account is found, deposit transaction should return success", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "D",
        50
      );
      const updatedAccount: Account = createAccount(
        newTransaction.accountID,
        mockAccounts[0].balance + newTransaction.amount
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(
        newTransaction
      );
      expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
    });

    test("when account is found and updating has error result, return proper error", async () => {
      const expectedError = createErrorResult("Invalid operation");
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "D",
        50
      );
      const updatedAccount: Account = createAccount(
        newTransaction.accountID,
        mockAccounts[0].balance + newTransaction.amount
      );

      mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);
      mockAccountDA.updateAccount.mockResolvedValue(expectedError);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createErrorResult("Invalid operation"));
    });

    test("when there is no previous transactions, test should return success", async () => {
      const newTransaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "D",
        100
      );

      const account = createAccount("Account01", 0);
      mockAccountDA.getAccountByID.mockResolvedValue(account);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountID: "Account01",
          balance: 100,
        })
      );
    });

    test("when an error occurred while inserting the transaction", async () => {
      const newTransaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "D",
        100
      );

      const account = createAccount("Account01", 0);
      mockAccountDA.getAccountByID.mockResolvedValue(account);
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);
      mockTransactionDA.addTransaction.mockRejectedValue(
        createCustomErrorResult(
          "An error occurred while inserting the transaction"
        )
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(
        createCustomErrorResult(
          "An error occurred while inserting the transaction"
        )
      );
    });

    test("when an error occurred while creating the account", async () => {
      const newTransaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "D",
        100
      );

      mockAccountDA.getAccountByID.mockResolvedValue(undefined);
      mockAccountDA.createNewAccount.mockRejectedValue(
        createCustomErrorResult("An error occurred while creating the account")
      );

      const result = await transactionService.process(newTransaction);

      expect(result).toEqual(
        createCustomErrorResult("An error occurred while creating the account")
      );
    });
  });

  test("when an error occurred while updating the account", async () => {
    const newTransaction = createTransaction(
      "20240320-01",
      new Date("2024-03-20"),
      "Account01",
      "D",
      100
    );

    const account = createAccount("Account01", 0);
    mockAccountDA.getAccountByID.mockResolvedValue(account);
    mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);
    mockAccountDA.updateAccount.mockRejectedValue(
      createCustomErrorResult("An error occurred while updating the account")
    );

    const result = await transactionService.process(newTransaction);

    expect(result).toEqual(
      createCustomErrorResult("An error occurred while updating the account")
    );
  });

  describe("generateTransactionID_test", () => {
    test("when getTransactionsByAccountID returns null, should handle gracefully", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(null);

      const result = await transactionService.generateTransactionID(
        new Date("2024-03-20"),
        "Account01"
      );

      expect(result).toBe("20240320-01");
    });

    test("when getTransactionsByAccountID returns undefined, should handle gracefully", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(undefined);

      const result = await transactionService.generateTransactionID(
        new Date("2024-03-20"),
        "Account01"
      );

      expect(result).toBe("20240320-01");
    });

    test("when account has no transactions, it should return transaction ID", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        50
      );

      const result = await (transactionService as any).generateTransactionID(
        newTransaction.date,
        newTransaction.accountID
      );

      expect(result).toEqual("20240320-01");
      expect(mockTransactionDA.getTransactionsByAccountID).toHaveBeenCalledWith(
        newTransaction.accountID
      );
    });

    test("when account has transactions, it should return new transaction ID", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        50
      );
      const transactions: Transaction[] = [
        createTransaction(
          "20240320-01",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-02",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        transactions
      );

      const result = await (transactionService as any).generateTransactionID(
        newTransaction.date,
        newTransaction.accountID
      );

      expect(result).toEqual("20240320-03");
      expect(mockTransactionDA.getTransactionsByAccountID).toHaveBeenCalledWith(
        newTransaction.accountID
      );
    });

    test("when account has many 2 digits transactions on same date, it should return new transaction ID", async () => {
      const newTransaction: Transaction = createTransaction(
        "20240320-01",
        new Date("2024-03-20"),
        "Account01",
        "W",
        50
      );
      const transactions: Transaction[] = [
        createTransaction(
          "20240320-01",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-02",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-03",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-04",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-05",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-06",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-07",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-08",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-09",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
        createTransaction(
          "20240320-10",
          new Date("2024-03-20"),
          "Account01",
          "W",
          50
        ),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        transactions
      );

      const result = await (transactionService as any).generateTransactionID(
        newTransaction.date,
        newTransaction.accountID
      );

      expect(result).toEqual("20240320-11");
      expect(mockTransactionDA.getTransactionsByAccountID).toHaveBeenCalledWith(
        newTransaction.accountID
      );
    });
  });
});
