import { Account } from "@/models/account";
import { InterestRule } from "@/models/interest";
import { Transaction } from "@/models/transaction";

export function createTransaction(
  transactionID: string,
  accountID: string,
  date: Date,
  type: "D" | "W",
  amount: number
): Transaction {
  return {
    transactionID,
    date,
    accountID,
    type,
    amount,
  };
}

export function createAccount(accountID: string, balance: number): Account {
  return {
    accountID,
    balance,
  };
}

export function createInterestRule(
  ruleID: string,
  date: Date,
  rate: number
): InterestRule {
  return {
    ruleID,
    date,
    rate,
  };
}
