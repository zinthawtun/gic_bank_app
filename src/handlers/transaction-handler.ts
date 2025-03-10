import inquirer from "inquirer";
import chalk from "chalk";
import { TransactionService } from "@services/transaction-service";
import { FileService } from "@/infrastructure/file-service";
import { TransactionDA } from "@/data-access/transaction-da";
import { AccountDA } from "@/data-access/account-da";
import { Transaction } from "@/models/transaction";

export const handleTransactionInputs = async (): Promise<boolean> => {
  const transactionService = new TransactionService(
    new AccountDA(new FileService()),
    new TransactionDA(new FileService())
  );

  while (true) {
    const { input } = await inquirer.prompt<{ input: string }>([
      {
        type: "input",
        name: "input",
        message: chalk.green(
          "\nPlease enter transaction details in <Date> <Account> <Type> <Amount>\n (or enter blank to go back to main menu):\n > "
        ),
        theme: { prefix: "" },
      },
    ]);

    if (!input.trim()) {
      return true;
    }

    const [date, account, type, amount] = input.split(" ");
    if (!date || !account || !type || !amount) {
      console.log(chalk.red("Invalid transaction input"));
      continue;
    }

    if (!/^\d{8}$/.test(date)) {
      console.log(chalk.red("Invalid date format. Use YYYYMMdd"));
      continue;
    }

    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6)) - 1;
    const day = parseInt(date.substring(6, 8));
    const transactionDate = new Date(Date.UTC(year, month, day));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getDate();

    if (
      isNaN(transactionDate.getTime()) ||
      day > lastDayOfMonth ||
      day <= 0 ||
      month < 0 ||
      month > 11
    ) {
      console.log(chalk.red("Invalid date"));
      continue;
    }

    if (type !== "D" && type !== "W") {
      console.log(
        chalk.red("Invalid transaction type. Valid types are 'D' for Deposit or 'W' for Withdrawal.")
      );
      continue;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      console.log(chalk.red("Invalid amount"));
      continue;
    }

    if (!/^\d+(\.\d{0,2})?$/.test(amount)) {
      console.log(chalk.red("Amount can have up to 2 decimal places"));
      continue;
    }

    if (parsedAmount <= 0) {
      console.log(chalk.red("Amount must be greater than 0"));
      continue;
    }

    if (parsedAmount > 1000000) {
      console.log(chalk.red("Amount must not exceed 1,000,000"));
      continue;
    }

    try {
      const newTransactionID = await transactionService.generateTransactionID(
        transactionDate,
        account
      );
      const transaction: Transaction = {
        transactionID: newTransactionID,
        date: transactionDate,
        accountID: account,
        type: type,
        amount: parsedAmount,
      };

      const result = await transactionService.process(transaction);
      if (!result.hasError) {
        console.log(chalk.green("Transaction successful!"));
        return true;
      }
      console.log(result.errorMessage);
      continue;
    } catch (error) {
      console.log(chalk.red(error));
      console.log(chalk.red("Failed to process transaction!"));
      continue;
    }
  }
};
