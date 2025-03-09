export interface InterestRule {
    ruleID: string;
    date: Date;
    rate: number;
}

export interface AccountInterest{
  accountID: string;
  date: Date;
  type: "I";
  amount: number;
}