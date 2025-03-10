import chalk from "chalk";
import inquirer from "inquirer";

import { IDType } from "@config/constants";
import { InterestRule } from "@models/interest";

import { createInterestRuleService } from "@utilities/service-factory-helper";
import {
  validateDate,
  validateInputID,
  ValidationError,
} from "@utilities/validation-helper";

export const handleInterestInputs = async (): Promise<boolean> => {
  const interestRuleService = createInterestRuleService();

  while (true) {
    try {
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

      const effectiveDate = validateDate(date);
      const interestRuleID = validateInputID(ruleId, IDType.INTEREST);

      const interestRate = parseFloat(rate);
      if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
        console.log(
          chalk.red("Invalid interest rate (must be between 0 and 100)")
        );
        continue;
      }

      const interest: InterestRule = {
        ruleID: interestRuleID,
        date: effectiveDate,
        rate: interestRate,
      };

      const result = await interestRuleService.createNewInterestRule(interest);

      if (!result.hasError) {
        console.log(chalk.green("Interest rule created successfully!"));
        return true;
      }

      console.log(result.errorMessage);
      continue;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(chalk.red(error.message));
      } else {
        console.log(
          chalk.red(
            "An unexpected error occurred while processing the interest rule"
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
