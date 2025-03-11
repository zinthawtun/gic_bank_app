import { InterestRuleDA } from "@data-access/interest-rule-da";
import { TransactionDA } from "@data-access/transaction-da";

import { Transaction, TransactionBalance } from "@models/transaction";
import { AccountStatementResult } from "@models/result";
import { InterestRule, AccountInterest } from "@models/interest";

import {
  createCustomErrorResult,
  createSuccessfulResult,
} from "@utilities/result-helper";

export class ReportService {
  private transactionDA: TransactionDA;
  private interestRuleDA: InterestRuleDA;

  constructor(transactionDA: TransactionDA, interestRuleDA: InterestRuleDA) {
    this.transactionDA = transactionDA;
    this.interestRuleDA = interestRuleDA;
  }

  public async runReport(
    accountID: string,
    date: Date
  ): Promise<AccountStatementResult> {
    try {
      const transactions = await this.getTransactions(accountID);

      if (transactions.length === 0) {
        return {
          result: createCustomErrorResult("No transaction found"),
          transactions: [],
          calculatedAccountInterest: undefined,
        } as AccountStatementResult;
      }

      const currentMonthTransactions = transactions.filter((t) =>
        this.isMonthYearEqual(t.date, date)
      );

      const historicalBalance = this.calculateHistoricalBalance(
        transactions,
        date
      );

      const currentMonthStatement = this.calculateCurrentMonthStatement(
        historicalBalance,
        currentMonthTransactions
      );

      if (currentMonthStatement.length === 0) {
        return {
          result: createCustomErrorResult("No transaction found for the month"),
          transactions: [],
          calculatedAccountInterest: undefined,
        } as AccountStatementResult;
      }

      const currentMonthAccountInterest =
        await this.calculateCurrentMonthInterestRate(
          accountID,
          transactions,
          date,
          historicalBalance
        );

      return {
        result: createSuccessfulResult(),
        transactions: currentMonthStatement,
        calculatedAccountInterest: currentMonthAccountInterest,
      } as AccountStatementResult;
    } catch (error) {
      return {
        result: createCustomErrorResult("Failed to generate account statement"),
        transactions: [],
        calculatedAccountInterest: undefined,
      } as AccountStatementResult;
    }
  }

  private async getTransactions(accountID: string): Promise<Transaction[]> {
    let result = await this.transactionDA.getTransactionsByAccountID(accountID);
    if (!result) {
      return [];
    }

    return result;
  }

  private calculateHistoricalBalance(
    transactions: Transaction[],
    date: Date
  ): number {
    const lastDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
    const historicalTransactions = transactions.filter((t) =>
      this.isMonthYearEqual(t.date, lastDate)
    );

    let balance = 0;

    historicalTransactions.forEach((t) => {
      balance += t.amount;
    });

    return balance;
  }

  private calculateCurrentMonthStatement(
    historicalBalance: number,
    currentMonthTransactions: Transaction[],
  ): TransactionBalance[] {
    let currentMonthStatement: TransactionBalance[] = [];

    currentMonthTransactions.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    let runningBalance = historicalBalance;

    currentMonthTransactions.forEach((t) => {
      runningBalance += t.type === "D" ? t.amount : -t.amount;
      currentMonthStatement.push({ transaction: t, balance: runningBalance });
    });

    return currentMonthStatement;
  }

  private async calculateCurrentMonthInterestRate(
    accountID: string,
    transactions: Transaction[],
    interestMonth: Date,
    historicalBalance: number
  ): Promise<AccountInterest> {
    const daysInMonth = new Date(
      interestMonth.getFullYear(),
      interestMonth.getMonth() + 1,
      0
    ).getDate();

    const listOfDaysInMonth: Date[] = Array.from(
      { length: daysInMonth },
      (_, i) => {
        return new Date(
          Date.UTC(interestMonth.getFullYear(), interestMonth.getMonth(), i + 1)
        );
      }
    ).sort((a, b) => a.getTime() - b.getTime());

    const firstDateOfCurrentMonth = listOfDaysInMonth[0];
    const endDateOfCurrentMonth = listOfDaysInMonth[listOfDaysInMonth.length - 1];

    const interestRules = await this.interestRuleDA.getAllInterestRules();
    if (interestRules.length === 0) {
      return {
        accountID: accountID,
        date: endDateOfCurrentMonth,
        amount: 0,
        type: "I"
      };
    }

    const sortedInterestRules = interestRules.sort((a, b) => a.date.getTime() - b.date.getTime());

    const dailyRates = this.getDailyInterestRates(listOfDaysInMonth, sortedInterestRules, firstDateOfCurrentMonth);
    
    const dailyBalances = this.calculateDailyBalances(listOfDaysInMonth, transactions, historicalBalance);

    const interest = this.calculateTotalInterest(dailyBalances, dailyRates);

    return {
      accountID: accountID,
      date: endDateOfCurrentMonth,
      amount: Number(interest.toFixed(2)),
      type: "I"
    };
  }

  private getDailyInterestRates(
    daysInMonth: Date[],
    interestRules: InterestRule[],
    firstDayOfMonth: Date
  ): Map<string, number> {
    const dailyRates = new Map<string, number>();
    
    const previousRules = interestRules
      .filter(r => r.date.getTime() < firstDayOfMonth.getTime());
    
    const initialRate = previousRules.length > 0 
      ? previousRules[previousRules.length - 1].rate 
      : 0;

    const currentMonthRules = interestRules
      .filter(r => this.isMonthYearEqual(r.date, firstDayOfMonth))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentRate = initialRate;
    daysInMonth.forEach(day => {
      const ruleForDay = currentMonthRules.find(
        r => r.date.getTime() === day.getTime()
      );
      
      if (ruleForDay) {
        currentRate = ruleForDay.rate;
      }
      
      dailyRates.set(day.toISOString(), currentRate);
    });

    return dailyRates;
  }

  private calculateDailyBalances(
    daysInMonth: Date[],
    transactions: Transaction[],
    historicalBalance: number
  ): Map<string, number> {
    const dailyBalances = new Map<string, number>();
    let updatedBalance = historicalBalance;

    const transactionsByDay = new Map<string, Transaction[]>();
    daysInMonth.forEach(day => {
      const dayTransactions = transactions.filter(
        t => t.date.getTime() === day.getTime()
      );
      if (dayTransactions.length > 0) {
        transactionsByDay.set(day.toISOString(), dayTransactions);
      }
    });

    daysInMonth.forEach(day => {
      const dayTransactions = transactionsByDay.get(day.toISOString()) || [];
      dayTransactions.forEach(transaction => {
        updatedBalance += transaction.type === "D" ? transaction.amount : -transaction.amount;
      });
      dailyBalances.set(day.toISOString(), updatedBalance);
    });

    return dailyBalances;
  }

  private calculateTotalInterest(
    dailyBalances: Map<string, number>,
    dailyRates: Map<string, number>
  ): number {
    let totalInterest = 0;

    dailyBalances.forEach((balance, day) => {
      const rate = dailyRates.get(day) || 0;
      totalInterest += balance * (rate / 100);
    });

    return totalInterest;
  }

  private isMonthYearEqual(date1: Date, date2: Date): boolean {
    const d1 = new Date(Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), 1));
    const d2 = new Date(Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), 1));
    return d1.getTime() === d2.getTime();
  }
}
