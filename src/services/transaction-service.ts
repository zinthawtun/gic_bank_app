import { Account } from "@/models/account";
import { Transaction } from "@/models/transaction";
import { AccountDA } from "@/data-access/account-da";
import { TransactionDA } from "@/data-access/transaction-da";
import { Result } from "@/models/result";
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

    if (transaction.type === "W") {
      if (account.balance < transaction.amount) {
        return createCustomErrorResult("Insufficient balance");
      }

      account.balance -= transaction.amount;

      return await this.executeTransaction(account, transaction);
    } else {
      account.balance += transaction.amount;

      return await this.executeTransaction(account, transaction);
    }
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

    let transactionID = `${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate()}-01`;

    while (transactionIDs.includes(transactionID)) {
      const previousID = transactionID.split("-")[1];
      const newID = parseInt(previousID) + 1;
      transactionID = `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate()}-${newID
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
    return await this.transactionDA.addTransaction(transaction);
  }

  private async createAccount(account: Account): Promise<Result> {
    return await this.accountDA.createNewAccount(account);
  }

  private async updateAccount(account: Account): Promise<Result> {
    return await this.accountDA.updateAccount(account);
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
