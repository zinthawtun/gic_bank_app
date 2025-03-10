import { AccountDA } from "@data-access/account-da";
import { TransactionDA } from "@data-access/transaction-da";

import { Account } from "@models/account";
import { Transaction } from "@models/transaction";
import { Result } from "@models/result";

import { createCustomErrorResult } from "@utilities/result-helper";

export class TransactionService {
  private accountDA: AccountDA;
  private transactionDA: TransactionDA;

  constructor(accountDA: AccountDA, transactionDA: TransactionDA) {
    this.accountDA = accountDA;
    this.transactionDA = transactionDA;
  }

  public async process(transaction: Transaction): Promise<Result> {
    let account = await this.getAccountByAccountID(transaction.accountID);
    let result: Result;

    if (!account) {
      const newAccount: Account = {
        accountID: transaction.accountID,
        balance: 0,
      };

      result = await this.createAccount(newAccount);

      if (result.hasError) {
        return result;
      }

      account = { ...newAccount };
    }

    const currentAccountTransactions = await this.transactionDA.getTransactionsByAccountID(
      transaction.accountID
    );

    if (currentAccountTransactions) {
      for (const t of currentAccountTransactions) {
        if (t.date.getTime() > transaction.date.getTime()) {
          return createCustomErrorResult("Cannot process transaction in the past");
        }
      }
    }
    
    let updatedBalance: number;

    if (transaction.type === "D") {
      updatedBalance = account.balance + transaction.amount;
    } else {
      updatedBalance = account.balance - transaction.amount;
    }

    if (updatedBalance < 0) {
      return createCustomErrorResult("Insufficient balance");
    }

    account.balance = updatedBalance;

    return await this.executeTransaction(account, transaction);
  }

  public async generateTransactionID(
    date: Date,
    accountID: string
  ): Promise<string> {
    const transactions = await this.transactionDA.getTransactionsByAccountID(
      accountID
    );
    const transactionIDs = transactions
      ? transactions.map((t) => t.transactionID)
      : [];

    let transactionID = `${date.getUTCFullYear()}${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getUTCDate()}-01`;

    while (transactionIDs.includes(transactionID)) {
      const previousID = transactionID.split("-")[1];
      const newID = parseInt(previousID) + 1;
      transactionID = `${date.getUTCFullYear()}${(date.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getUTCDate()}-${newID
        .toString()
        .padStart(2, "0")}`;
    }

    return transactionID;
  }

  private async getAccountByAccountID(
    accountID: string
  ): Promise<Account | undefined> {
    return await this.accountDA.getAccountByID(accountID);
  }

  private async insertTransaction(transaction: Transaction): Promise<Result> {
    try {
      return await this.transactionDA.addTransaction(transaction);
    } catch (error) {
      return createCustomErrorResult("An error occurred while inserting the transaction");
    }
  }

  private async createAccount(account: Account): Promise<Result> {
    try {
      return await this.accountDA.createNewAccount(account);
    } catch (error) {
      return createCustomErrorResult("An error occurred while creating the account");
    }
  }

  private async updateAccount(account: Account): Promise<Result> {
    try {
      return await this.accountDA.updateAccount(account);
    } catch (error) {
      return createCustomErrorResult("An error occurred while updating the account");
    }
  }

  private async executeTransaction(
    account: Account,
    transaction: Transaction
  ): Promise<Result> {
    let result: Result = await this.updateAccount(account);

    if (result.hasError) {
      return result;
    }

    return await this.insertTransaction(transaction);
  }
}
