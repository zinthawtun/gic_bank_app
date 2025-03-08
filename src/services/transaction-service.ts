import { Account } from "@/models/account";
import { Transaction } from "@/models/transaction";
import { AccountDA } from "@/data-access/account-da";
import { TransactionDA } from "@/data-access/transaction-da";
import { Result } from "@/models/result";
import { createSuccessfulResult } from "@utilities/result-helper";

export class TransactionService {
  private accountDA: AccountDA;
  private transactionDA: TransactionDA;

  constructor(accountDA: AccountDA, transactionDA: TransactionDA) {
    this.accountDA = accountDA;
    this.transactionDA = transactionDA;
  }

  public async process(transaction: Transaction): Promise<void> {
    let account: Account | undefined = await this.accountDA.getAccountByID(transaction.accountID);

    if (!account) {
      throw new Error("Account not found");
    }
  }
  
  private validateTransaction(transaction: Transaction): boolean {
    return false;
  }

  private validateAccount(account: Account): boolean {
    return false;
  }

  private createTransaction(transaction: Transaction): Result {
    return createSuccessfulResult();
  }

  private createAccount(account: Account): Result {
    return createSuccessfulResult();
  }

  private getAccountBalance(account: Account): number {
    return 0;
  }
}