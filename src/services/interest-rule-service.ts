import { InterestRule } from "@models/interest";
import { InterestRuleDA } from "@data-access/interest-rule-da";

import { Result } from "@models/result";

import { createCustomErrorResult } from "@utilities/result-helper";

export class InterestRuleService {
  private interestRuleDA: InterestRuleDA;

  constructor(interestRuleDA: InterestRuleDA) {
    this.interestRuleDA = interestRuleDA;
  }

  public async createNewInterestRule(
    interestRule: InterestRule
  ): Promise<Result> {
    if (
      !interestRule ||
      !interestRule.ruleID ||
      !interestRule.date ||
      interestRule.rate === undefined ||
      interestRule.rate < 0 ||
      interestRule.rate > 100
    ) {
      return createCustomErrorResult("Invalid interest rule");
    }

    const rules: InterestRule[] = await this.loadAllInterestRules();

    let existingRule = rules.find(
      (rule) =>
        new Date(rule.date).getTime() === new Date(interestRule.date).getTime()
    );

    if (!existingRule) {
      return await this.saveNewInterestRule(interestRule);
    } else if (
      existingRule.ruleID !== interestRule.ruleID &&
      existingRule.rate !== interestRule.rate
    ) {
      return await this.replaceInterestRule(existingRule, interestRule, rules);
    } else {
      return createCustomErrorResult("Interest rule already exists");
    }
  }

  private async loadAllInterestRules(): Promise<InterestRule[]> {
    return await this.interestRuleDA.getAllInterestRules();
  }

  private async saveNewInterestRule(
    interestRule: InterestRule
  ): Promise<Result> {
    return await this.interestRuleDA.insertNewInterestRule(interestRule);
  }

  private async replaceInterestRule(
    oldRule: InterestRule,
    newRule: InterestRule,
    rules: InterestRule[]
  ): Promise<Result> {
    return await this.interestRuleDA.replaceInterestRule(
      oldRule,
      newRule,
      rules
    );
  }
}
