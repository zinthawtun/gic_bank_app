import inquirer from "inquirer";
import chalk from "chalk";

import { IDType } from "@config/constants";
import { Transaction } from "@models/transaction";

import {
  validateDate,
  validateAmount,
  validateTransactionType,
  ValidationError,
  validateInputID,
} from "@utilities/validation-helper";
import { createTransactionService } from "@utilities/service-factory-helper";

export const handleTransactionInputs = async (): Promise<boolean> => {
  const transactionService = createTransactionService();

  while (true) {
    try {
      const { input } = await inquirer.prompt<{ input: string }>([
        {
          type: "input",
          name: "input",
          message: chalk.green(
            "\nPlease enter transaction details in <Date> <Account> <Type> <Amount>\n(or enter blank to go back to main menu):\n > "
          ),
          theme: { prefix: "" },
        },
      ]);

      if (!input.trim()) {
        return true;
      }

      const [date, account, type, amount] = input.split(" ");
      if (!date || !account || !type || !amount) {
        console.log(chalk.red("Invalid transaction input format"));
        continue;
      }

      const transactionDate = validateDate(date);
      const accountID = validateInputID(account, IDType.ACCOUNT);
      const transactionType = validateTransactionType(type);
      const transactionAmount = validateAmount(amount);

      const newTransactionID = await transactionService.generateTransactionID(
        transactionDate,
        account
      );

      const transaction: Transaction = {
        transactionID: newTransactionID,
        date: transactionDate,
        accountID: accountID,
        type: transactionType,
        amount: transactionAmount,
      };

      const result = await transactionService.process(transaction);
      if (!result.hasError) {
        console.log(chalk.green("Transaction successful!"));
        return true;
      }
      console.log(chalk.red(result.errorMessage));
      continue;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(chalk.red(error.message));
      } else {
        console.log(
          chalk.red(
            "An unexpected error occurred while processing the transaction"
          )
        );
        if (error instanceof Error) {
          console.log(chalk.red(error.message));
        }
      }
      continue;
    }
  }
};
