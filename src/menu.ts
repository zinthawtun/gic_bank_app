import inquirer from "inquirer";
import chalk from "chalk";

import { MenuOption, ValidationMessages } from "@config/constants";

import { handleTransactionInputs } from "@handlers/transaction-handler";
import { handleInterestInputs } from "@handlers/interest-rule-handler";
import { handleStatementInputs } from "@handlers/statement-handler";

export const Menu = async (): Promise<string> => {
  console.log(
    chalk.green("Welcome to AwesomeGIC Bank! What would you like to do?")
  );

  try {
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: "input",
        name: "action",
        message: chalk.green(
          "[T] Input transactions\n [I] Define interest rules\n [P] Print statement\n [Q] Quit\n >"
        ),
        validate: (input) => {
          const upperInput = input.toUpperCase().trim();
          if (Object.values(MenuOption).includes(upperInput as MenuOption)) {
            return true;
          }
          return ValidationMessages.INVALID_MENU_CHOICE;
        },
        theme: { prefix: "" },
      },
    ]);

    const choice = action.toUpperCase().trim() as MenuOption;

    switch (choice) {
      case MenuOption.TRANSACTIONS:
        await handleTransactionInputs();
        break;
      case MenuOption.INTEREST_RULES:
        await handleInterestInputs();
        break;
      case MenuOption.PRINT_STATEMENT:
        await handleStatementInputs();
        break;
      case MenuOption.QUIT:
        return "exit";
      default:
        console.log(chalk.red(ValidationMessages.INVALID_MENU_CHOICE));
    }

    console.log(chalk.green("Is there anything else you'd like to do?"));
  } catch (error) {
    console.log(chalk.red("An error occurred while processing your request"));
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
  return "";
};
