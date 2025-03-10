export interface Transaction {
  transactionID: string;
  date: Date;
  accountID: string;
  type: "D" | "W";
  amount: number;
}

export interface TransactionBalance{
  transaction: Transaction;
  balance: number;
}