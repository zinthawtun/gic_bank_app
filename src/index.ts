import chalk from "chalk";

import { Menu } from "@/menu";

const main = async (): Promise<void> => {
  try {
    let choice: string = "";
    while (choice !== "exit") {
      choice = await Menu();
    }
    console.log(
      chalk.green(
        "Thank you for banking with AwesomeGIC Bank.\nHave a nice day!"
      )
    );
  } catch (error) {
    console.error(chalk.red("An unexpected error occurred:"));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
};

main();
