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
import exp from "constants";
import { create } from "domain";

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
        }
    ];
    
    beforeEach(() => {
        jest.clearAllMocks();
    
        mockAccountDA.getAccountByID.mockResolvedValue(undefined);
        mockAccountDA.createNewAccount.mockResolvedValue(createSuccessfulResult());
        mockAccountDA.updateAccount.mockResolvedValue(createSuccessfulResult());
        mockTransactionDA.addTransaction.mockResolvedValue(createSuccessfulResult());
        mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);

        transactionService = new TransactionService(
            new AccountDA(new FileService()), 
            new TransactionDA(new FileService())
        );
    });
    
    describe("process_test", () => {
        test("when account is not found, withdrawal transaction should return error", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account03", new Date("2024-03-20"), "W", 100 );
            mockAccountDA.getAccountByID.mockResolvedValue(undefined);

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
        });

        test("when account is not found, it should create a new account, execute the deposit transaction, and update the account balance", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account03", new Date("2024-03-20"), "D", 100 );
            const newAccount: Account = createAccount(newTransaction.accountID, 0);
            const updatedAccount: Account = createAccount(newTransaction.accountID, newTransaction.amount);

            mockAccountDA.getAccountByID.mockResolvedValue(undefined);
            mockAccountDA.createNewAccount.mockResolvedValue(createSuccessfulResult());

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockAccountDA.getAccountByID).toHaveBeenCalledWith(newTransaction.accountID);
            expect(mockAccountDA.createNewAccount).toHaveBeenCalledWith({...newAccount});
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
        });

        test("when account is not found, new account is created, transaction withdrawal should return error if balance is insufficient", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account03", new Date("2024-03-20"), "W", 100 );
            const newAccount: Account = createAccount(newTransaction.accountID, 0);

            mockAccountDA.getAccountByID.mockResolvedValue(undefined);
            mockAccountDA.createNewAccount.mockResolvedValue(createSuccessfulResult());

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
        });

        test("when account is not found, creating account has error and return error", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account03", new Date("2024-03-20"), "D", 100 );
            const newAccount: Account = createAccount(newTransaction.accountID, 0);

            mockAccountDA.getAccountByID.mockResolvedValue(undefined);
            mockAccountDA.createNewAccount.mockResolvedValue(createErrorResult("Invalid operation"));

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createErrorResult("Invalid operation"));
        });

        test("when account is found, withdrawal insufficient amount should return error", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 200 );

            mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createCustomErrorResult("Insufficient balance"));
        });

        test("when account is found, withdrawal sufficient amount should return success", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 50 );
            const updatedAccount: Account = createAccount(newTransaction.accountID, mockAccounts[0].balance - newTransaction.amount);

            mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
        });

        test("when account is found, deposit transaction should return success", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "D", 50 );
            const updatedAccount: Account = createAccount(newTransaction.accountID, mockAccounts[0].balance + newTransaction.amount);

            mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);

            const result = await transactionService.process(newTransaction);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
        });
    });

    describe("getAccountByAccountID_test", () => {
        test("when account is not found, it should return undefined", async () => {
            mockAccountDA.getAccountByID.mockResolvedValue(undefined);

            const result = await (transactionService as any).getAccountByAccountID("Account03");

            expect(result).toBeUndefined();
            expect(mockAccountDA.getAccountByID).toHaveBeenCalledWith("Account03");
        });

        test("when account is found, it should return the account", async () => {
            mockAccountDA.getAccountByID.mockResolvedValue(mockAccounts[0]);

            const result = await (transactionService as any).getAccountByAccountID("Account01");

            expect(result).toEqual(mockAccounts[0]);
            expect(mockAccountDA.getAccountByID).toHaveBeenCalledWith("Account01");
        });
    });

    describe("insertTransaction_test", () => {
        test("when transaction is valid, it should return success", async () => {
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 50 );

            const result = await (transactionService as any).insertTransaction(newTransaction);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
        });
    });

    describe("createAccount_test", () => {
        test("when account is valid, it should return success", async () => {
            const newAccount: Account = createAccount("Account03", 0 );

            const result = await (transactionService as any).createAccount(newAccount);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockAccountDA.createNewAccount).toHaveBeenCalledWith(newAccount);
        });
    });

    describe("updateAccount_test", () => {
        test("when account is valid, it should return success", async () => {
            const updatedAccount: Account = createAccount("Account01", 150 );

            const result = await (transactionService as any).updateAccount(updatedAccount);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(updatedAccount);
        });
    });

    describe("executeTransaction_test", () => {
        test("when account update has error, it should return error", async () => {
            const account: Account = createAccount("Account01", 150 );
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 200 );

            mockAccountDA.updateAccount.mockResolvedValue(createErrorResult("Invalid operation"));

            const result = await (transactionService as any).executeTransaction(account, newTransaction);

            expect(result).toEqual(createErrorResult("Invalid operation"));
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(account);
        });

        test("when transaction add has error, it should return error", async () => {
            const account: Account = createAccount("Account01", 150 );
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 50 );

            mockAccountDA.updateAccount.mockResolvedValue(createSuccessfulResult());
            mockTransactionDA.addTransaction.mockResolvedValue(createErrorResult("Invalid operation"));
            
            const result = await (transactionService as any).executeTransaction(account, newTransaction);

            expect(result).toEqual(createErrorResult("Invalid operation"));
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(account);
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
        });
        
        test("when account is valid, it should return success", async () => {
            const account: Account = createAccount("Account01", 150 );
            const newTransaction: Transaction = createTransaction("20240320-01", "Account01", new Date("2024-03-20"), "W", 50 );

            const result = await (transactionService as any).executeTransaction(account, newTransaction);

            expect(result).toEqual(createSuccessfulResult());
            expect(mockAccountDA.updateAccount).toHaveBeenCalledWith(account);
            expect(mockTransactionDA.addTransaction).toHaveBeenCalledWith(newTransaction);
        });
    });
});