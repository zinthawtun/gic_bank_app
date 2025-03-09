import inquirer from "inquirer";
import chalk from "chalk";
import { TransactionService } from "@services/transaction-service";
import { FileService } from "@/infrastructure/file-service";
import { TransactionDA } from "@/data-access/transaction-da";
import { AccountDA } from "@/data-access/account-da";
import { Transaction } from "@/models/transaction";
import { Result } from "@/models/result";

export const handleTransactionInputs = async (): Promise<boolean> => {
  const transactionService = new TransactionService(
    new AccountDA(new FileService()),
    new TransactionDA(new FileService())
  );
  console.log("Enter transaction details:");

  while (true) {
    const { input } = await inquirer.prompt<{ input: string }>([
      {
        type: "input",
        name: "input",
        message: chalk.green(
          "\nEnter transaction <Date> <Account> <Type> <Amount> (or press Enter to go back):\n > "
        ),
        theme: { prefix: "" },
      },
    ]);

    if (!input.trim()) {
      return true;
    }

    const [date, account, type, amount] = input.split(" ");
    if (!date || !account || !type || !amount) {
      console.log("Invalid transaction input");
      continue;
    }

    if (!/^\d{8}$/.test(date)) {
      console.log("Invalid date format. Use YYYYMMdd");
      continue;
    }

    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6)) - 1;
    const day = parseInt(date.substring(6, 8));
    const transactionDate = new Date(year, month, day);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    if (
      isNaN(transactionDate.getTime()) ||
      day > lastDayOfMonth ||
      day <= 0 ||
      month < 0 ||
      month > 11
    ) {
      console.log("Invalid date");
      continue;
    }

    if (type !== "D" && type !== "W") {
      console.log(
        "Invalid transaction type. Valid types are 'D' for Deposit or 'W' for Withdrawal."
      );
      continue;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      console.log("Invalid amount");
      continue;
    }

    if (!/^\d+(\.\d{0,2})?$/.test(amount)) {
      console.log("Amount can have up to 2 decimal places");
      continue;
    }

    if (parsedAmount <= 0) {
      console.log("Amount must be greater than 0");
      continue;
    }

    if (parsedAmount > 1000000) {
      console.log("Amount must not exceed 1,000,000");
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
        console.log("Transaction successful");
        return true;
      }
      console.log(result.errorMessage);
      continue;
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else if ((error as Result).errorMessage) {
        console.log((error as Result).errorMessage);
      } else {
        console.log("Processing failed");
      }
      continue;
    }
  }
};
