export interface Transaction {
  transactionID: string;
  transactionDate: Date;
  accountID: string;
  type: "D" | "W";
  amount: number;
}
