import { FileService } from "@infrastructure/file-service";
import { Result } from "@models/result";
import { Transaction } from "@models/transaction";
import {
  createSuccessfulResult,
  createErrorResult,
  createCustomErrorResult,
} from "@utilities/result-helper";

const transactionFilePath = "@data/transactions.json";

export class TransactionDA {
  private readonly fileService: FileService;
  constructor(fileService: FileService) {
    this.fileService = fileService;
  }

  public async getTransactionsByAccountID(
    accountID: string
  ): Promise<Transaction[] | undefined> {
    if (!accountID) {
      return undefined;
    }

    const transactions = await this.getTransactions();

    return transactions.filter((t) => t.accountID.toLowerCase() === accountID.toLowerCase());
  }

  public async addTransaction(transaction: Transaction): Promise<Result> {
    if (
      !transaction ||
      !transaction.transactionID ||
      !transaction.accountID ||
      !transaction.date ||
      !transaction.type ||
      transaction.amount === undefined ||
      transaction.amount <= 0
    ) {
      return createCustomErrorResult("Invalid transaction");
    }

    const transactions = await this.getTransactions();

    const transactionIDs = new Set(transactions.map((t) => t.transactionID));

    if (transactionIDs.has(transaction.transactionID)) {
      return createCustomErrorResult("Transaction already exists");
    }

    transactions.push(transaction);

    return await this.saveTransactions(transactions);
  }

  private async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.fileService.readFile<Transaction[]>(transactionFilePath);
    return transactions.map(t => ({
      ...t,
      date: new Date(t.date)
    }));
  }

  private async saveTransactions(transactions: Transaction[]): Promise<Result> {
    try {
      await this.fileService.writeFile(transactionFilePath, transactions);

      return createSuccessfulResult();
    } catch (error) {
      return createErrorResult(error);
    }
  }
}
