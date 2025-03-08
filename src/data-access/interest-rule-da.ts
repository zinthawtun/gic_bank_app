import { InterestRule } from "@/models/interest";
import { Result, ValidationError } from "@/models/result";
import {
  createCustomErrorResult,
  createErrorResult,
  createSuccessfulResult,
} from "@/utilities/result-helper";
import { FileService } from "@infrastructure/file-service";

const interestRuleFilePath = "@data/interest-rules.json";

export class InterestRuleDA {
  private fileService: FileService;
  constructor(fileService: FileService) {
    this.fileService = fileService;
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

    const rules = await this.getInterestRules();
    const ruleIDs = new Set(rules.map((rule) => rule.ruleID));

    if (ruleIDs.has(interestRule.ruleID)) {
      return createCustomErrorResult("Interest rule already exists");
    }

    rules.push(interestRule);

    return await this.saveInterestRules(rules);
  }

  public async replaceInterestRule(
    oldRule: InterestRule,
    newRule: InterestRule,
    rules: InterestRule[]
  ): Promise<Result> {
    if (!oldRule || !newRule || !rules) {
      return createCustomErrorResult("Invalid operation");
    }

    if (rules.length === 0) {
      return createCustomErrorResult("No interest rules found");
    }
    const index = rules.indexOf(oldRule);
    if (index === -1) {
      return createCustomErrorResult("Old interest rule not found");
    }
    rules.splice(index, 1);
    rules.splice(rules.indexOf(oldRule), 1);

    rules.push(newRule);

    return await this.saveInterestRules(rules);
  }

  public async getAllInterestRules(): Promise<InterestRule[]> {
    return await this.getInterestRules();
  }

  private async getInterestRules(): Promise<InterestRule[]> {
    return this.fileService.readFile<InterestRule[]>(interestRuleFilePath);
  }

  private async saveInterestRules(
    interestRules: InterestRule[]
  ): Promise<Result> {
    try {
      await this.fileService.writeFile(interestRuleFilePath, interestRules);

      return createSuccessfulResult();
    } catch (error) {
      return createErrorResult(error);
    }
  }
}
