export interface Transaction {
  transactionID: string;
  date: Date;
  accountID: string;
  type: "D" | "W";
  amount: number;
}
