import { AccountInterest } from "@models/interest";
import { TransactionBalance } from "@models/transaction";

export interface Result {
  hasError: boolean;
  errorMessage: string | undefined;
}

export interface AccountStatementResult {
  result: Result;
  transactions: TransactionBalance[];
  calculatedAccountInterest: AccountInterest | undefined;
}