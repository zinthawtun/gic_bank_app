import { InterestRule } from "@/models/interest";
import { InterestRuleDA } from "@/data-access/interest-rule-da";
import { Result } from "@/models/result";

import { createCustomErrorResult } from "@/utilities/result-helper";


export class InterestRuleService {
  private interestRuleDA: InterestRuleDA;

  constructor(interestRuleDA: InterestRuleDA) {
    this.interestRuleDA = interestRuleDA;
  }

  public async createNewInterestRule(interestRule: InterestRule): Promise<Result> {
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

    return await this.interestRuleDA.insertNewInterestRule(interestRule);
  }

}