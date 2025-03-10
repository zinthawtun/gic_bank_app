import inquirer from "inquirer";
import chalk from "chalk";

import { AccountInterest } from "@models/interest";
import { TransactionBalance } from "@models/transaction";

import { createReportService } from "@utilities/service-factory-helper";

export const handleStatementInputs = async (): Promise<boolean> => {
  const reportService = createReportService();

  while (true) {
    const { input } = await inquirer.prompt<{ input: string }>([
      {
        type: "input",
        name: "input",
        message: chalk.green(
          "\nPlease enter account and month to generate the statement <Account> <Year><Month>\n (or enter blank to go back to main menu):\n >"
        ),
        theme: { prefix: "" },
      },
    ]);

    if (!input.trim()) {
      return true;
    }

    const [account, YearMonthDate] = input.split(" ");

    if (!account || !YearMonthDate) {
      console.log(chalk.red("Invalid statement input"));
      return true;
    }

    if (!/^\d{6}$/.test(YearMonthDate)) {
      console.log(chalk.red("Invalid date format. Use YYYYMM"));
      return true;
    }

    const year = parseInt(YearMonthDate.substring(0, 4));
    const month = parseInt(YearMonthDate.substring(4, 6)) - 1;
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));

    if (isNaN(firstDayOfMonth.getTime()) || month < 0 || month > 11) {
      console.log(chalk.red("Invalid date"));
      return true;
    }

    try {
      const result = await reportService.runReport(account, firstDayOfMonth);

      if (result.transactions.length === 0) {
        console.log(chalk.green("No transactions found"));
        return true;
      }

      if (!result.result.hasError) {
        printStatement(
          account,
          result.transactions,
          result?.calculatedAccountInterest
        );
        return true;
      }

      console.log(chalk.red(result.result.errorMessage));
      return true;
    } catch (error) {
      console.log(chalk.red("Error generating statement:"));
      console.log(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      continue;
    }
  }
};

const printStatement = (
  accountID: string,
  statement: TransactionBalance[],
  monthlyInterest: AccountInterest | undefined
): void => {
  console.log(chalk.yellow(`Account: ${accountID}`));

  type TableRow = {
    Date: string;
    "Txn Id": string;
    Type: string;
    Amount: string;
    Balance: string;
  };

  const tableData: TableRow[] = statement.map((s) => ({
    Date: s.transaction.date.toISOString().slice(0, 10).replace(/-/g, ""),
    "Txn Id": s.transaction.transactionID,
    Type: s.transaction.type,
    Amount: s.transaction.amount.toFixed(2),
    Balance: s.balance.toFixed(2),
  }));

  if (monthlyInterest) {
    const totalAmountAfterInterest =
      statement[statement.length - 1].balance + monthlyInterest.amount;
    const interestRow: TableRow = {
      Date: monthlyInterest.date.toISOString().slice(0, 10).replace(/-/g, ""),
      "Txn Id": "",
      Type: "I",
      Amount: monthlyInterest.amount.toFixed(2),
      Balance: totalAmountAfterInterest.toFixed(2),
    };
    tableData.push(interestRow);
  }

  console.table(tableData);
};
