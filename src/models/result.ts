import { AccountInterest } from "./interest";
import { TransactionBalance } from "./transaction";

export interface Result {
  hasError: boolean;
  errorMessage: string | undefined;
}

export interface AccountStatementResult {
  result: Result;
  transactions: TransactionBalance[];
  calculatedAccountInterest: AccountInterest | undefined;
}