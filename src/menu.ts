import inquirer from "inquirer";
import chalk from "chalk";
import { handleTransactionInputs } from "./handlers/transaction-handler";
import { handleInterestInputs } from "./handlers/interest-rule-handler";
import { handleStatementInputs } from "./handlers/statement-handler";

export const Menu = async () => {
  console.log(
    chalk.green("Welcome to AwesomeGIC Bank! What would you like to do?")
  );

  try {
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: "input",
        name: "action",
        message:
          "[T] Transactions\n [I] Interest Rules\n [P] Print Statement\n [Q] Quit\n >",
        validate: (input) => {
          if (
            input === "T" ||
            input === "t" ||
            input === "I" ||
            input === "i" ||
            input === "P" ||
            input === "p" ||
            input === "Q" ||
            input === " q"
          ) {
            return true;
          }
          return "Invalid choice. Please enter T, I, P, or Q";
        },
        theme: { prefix: "" },
      },
    ]);

    switch (action.toUpperCase()) {
      case "T":
        await handleTransactionInputs();
        break;
      case "I":
        await handleInterestInputs();
        break;
      case "P":
        await handleStatementInputs();
        break;
      case "Q":
        return "exit";
    }
  } catch (error) {
    console.log(chalk.red("An error occurred"));
    console.log(error);
  }
};
