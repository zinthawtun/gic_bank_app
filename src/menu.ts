import inquirer from "inquirer";
import chalk from "chalk";

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
        return "Transactions";
      case "I":
        console.log("Interest Rules");
        return "Interest Rules";
      case "P":
        console.log("Print Statement");
        return "Print Statement";
      case "Q":
        return "exit";
    }
  } catch (error) {
    console.log(chalk.red("An error occurred"));
    console.log(error);
  }
};
