import chalk from "chalk";
import inquirer from "inquirer";

import { InterestRule } from "@models/interest";
import { InterestRuleDA } from "@data-access/interest-rule-da";

import { FileService } from "@/infrastructure/file-service";
import { InterestRuleService } from "@/services/interest-rule-service";

export const handleInterestInputs = async (): Promise<boolean> => {
  const interestRuleService = new InterestRuleService(
    new InterestRuleDA(new FileService())
  );

  while (true) {
    const { input } = await inquirer.prompt<{ input: string }>([
      {
        type: "input",
        name: "input",
        message: chalk.green(
          "\nPlease enter interest rules details in <Date> <RuleId> <Rate in %> format:\n (or enter blank to go back to main menu):\n > "
        ),
        theme: { prefix: "" },
      },
    ]);

    if (!input.trim()) {
      return true;
    }
    const [date, ruleId, rate] = input.split(" ");
    if (!date || !ruleId || !rate) {
      console.log(chalk.red("Invalid interest rule input"));
      continue;
    }

    if (!/^\d{8}$/.test(date)) {
      console.log(chalk.red("Invalid date format. Use YYYYMMdd"));
      continue;
    }

    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6)) - 1;
    const day = parseInt(date.substring(6, 8));
    const interestDate = new Date(Date.UTC(year, month, day));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getDate();

    if (
      isNaN(interestDate.getTime()) ||
      day > lastDayOfMonth ||
      day <= 0 ||
      month < 0 ||
      month > 11
    ) {
      console.log(chalk.red("Invalid date"));
      continue;
    }

    const interestRate = parseFloat(rate);
    if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
      console.log(
        chalk.red("Invalid interest rate (must be between 0 and 100)")
      );
      continue;
    }

    const interest: InterestRule = {
      ruleID: ruleId,
      date: interestDate,
      rate: interestRate,
    };

    try {
      const result = await interestRuleService.createNewInterestRule(interest);

      if (!result.hasError) {
        console.log(chalk.green("Interest rule created successfully!"));
        return true;
      }

      console.log(result.errorMessage);
      continue;
    } catch (error) {
      console.log(chalk.red(error));
      console.log(chalk.red("Failed to create interest rule!"));
      continue;
    }
  }
};
