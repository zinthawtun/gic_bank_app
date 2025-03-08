import { InterestRule } from "@/models/interest";
import { InterestRuleDA } from "@/data-access/interest-rule-da";

import { createCustomErrorResult } from "@/utilities/result-helper";

import { InterestRuleService } from "@/services/interest-rule-service";
import { FileService } from "@/infrastructure/file-service";
import { createInterestRule } from "@test/scenario-helper";

const mockInterestRuleDA = {
  insertNewInterestRule: jest.fn(),
  getAllInterestRules: jest.fn(),
  replaceInterestRule: jest.fn(),
};

jest.mock("@/data-access/interest-rule-da", () => ({
  InterestRuleDA: jest.fn().mockImplementation(() => mockInterestRuleDA),
}));

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("InterestRuleService_Test", () => {
  let interestRuleService: InterestRuleService;
  let mockInterestRules: InterestRule[] = [
    {
      ruleID: "rule1",
      date: new Date("2024-01-01"),
      rate: 0.01,
    },
    {
      ruleID: "rule2",
      date: new Date("2024-01-02"),
      rate: 0.02,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockInterestRuleDA.insertNewInterestRule.mockResolvedValue(undefined);
    mockInterestRuleDA.getAllInterestRules.mockResolvedValue([]);
    mockInterestRuleDA.replaceInterestRule.mockResolvedValue(undefined);

    interestRuleService = new InterestRuleService(
      new InterestRuleDA(new FileService())
    );
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("createNewInterestRule_test", () => {
    test("when interest rule is empty, return error", async () => {
      const result = await interestRuleService.createNewInterestRule(
        undefined as any
      );

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when ruleID is empty, test should return error", async () => {
      const result = await interestRuleService.createNewInterestRule({
        ruleID: "",
        date: new Date(),
        rate: 0.01,
      });

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when date is empty, test should return error", async () => {
      const result = await interestRuleService.createNewInterestRule({
        ruleID: "rule1",
        date: undefined as any,
        rate: 0.01,
      });

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is less than 0, test should return error", async () => {
      const result = await interestRuleService.createNewInterestRule({
        ruleID: "rule1",
        date: new Date(),
        rate: -0.01,
      });

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is greater than 100, test should return error", async () => {
      const result = await interestRuleService.createNewInterestRule({
        ruleID: "rule1",
        date: new Date(),
        rate: 100.01,
      });

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when interest rule already exists, test should return error", async () => {
      const rule = createInterestRule("rule1", new Date("2024-01-01"), 0.01);
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await interestRuleService.createNewInterestRule(rule);

      expect(result).toEqual(
        createCustomErrorResult("Interest rule already exists")
      );

      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
    });

    test("when interest rule exists but ruleID the same and rates are different, replace existing interest rule, return error", async () => {
      const rule = createInterestRule("rule1", new Date("2024-01-01"), 0.02);
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await interestRuleService.createNewInterestRule(rule);

      expect(result).toEqual(
        createCustomErrorResult("Interest rule already exists")
      );

      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
    });

    test("when interest rule exists but different ruleIDs and rates are the same, replace existing interest rule, return error", async () => {
      const rule = createInterestRule("rule5", new Date("2024-01-01"), 0.01);
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await interestRuleService.createNewInterestRule(rule);

      expect(result).toEqual(
        createCustomErrorResult("Interest rule already exists")
      );

      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
    });

    test("when interest rule does not exist, insert new interest rule", async () => {
      const rule = createInterestRule("rule3", new Date("2024-01-03"), 0.03);
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await interestRuleService.createNewInterestRule(rule);

      expect(result).toEqual(undefined);

      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
      expect(mockInterestRuleDA.insertNewInterestRule).toHaveBeenCalledTimes(1);
      expect(mockInterestRuleDA.insertNewInterestRule).toHaveBeenCalledWith(
        rule
      );
    });

    test("when interest rule exists but different ruleIDs and rates are different, replace existing interest rule", async () => {
      const rule = createInterestRule("rule5", new Date("2024-01-01"), 0.02);
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await interestRuleService.createNewInterestRule(rule);

      expect(result).toEqual(undefined);

      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
      expect(mockInterestRuleDA.replaceInterestRule).toHaveBeenCalledTimes(1);
      expect(mockInterestRuleDA.replaceInterestRule).toHaveBeenCalledWith(
        mockInterestRules[0],
        rule,
        mockInterestRules
      );

      expect(mockInterestRuleDA.insertNewInterestRule).toHaveBeenCalledTimes(0);
      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
      expect(mockInterestRuleDA.replaceInterestRule).toHaveBeenCalledTimes(1);
    });
  });
});
