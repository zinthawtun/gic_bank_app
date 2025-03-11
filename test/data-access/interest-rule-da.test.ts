import { FilePaths } from "@config/constants";

import { InterestRuleDA } from "@data-access/interest-rule-da";

import { InterestRule } from "@models/interest";

import { FileService } from "@infrastructure/file-service";

import {
  createSuccessfulResult,
  createCustomErrorResult,
  createErrorResult,
} from "@utilities/result-helper";
import { createInterestRule } from "@test/scenario-helper";

const mockFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

jest.mock("@infrastructure/file-service", () => ({
  FileService: jest.fn().mockImplementation(() => mockFileService),
}));

describe("InterestRuleDA_Test", () => {
  let interestRuleDA: InterestRuleDA;
  const testFilePath = FilePaths.INTEREST_RULES;
  const mockInterestRules: InterestRule[] = [
    createInterestRule("rule1", new Date("2024-01-01"), 0.01),
    createInterestRule("rule2", new Date("2024-01-02"), 0.02),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileService.readFile.mockResolvedValue(mockInterestRules);
    mockFileService.writeFile.mockResolvedValue(undefined);

    interestRuleDA = new InterestRuleDA(new FileService());
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("createNewInterestRule_test", () => {
    test("when interest rule is empty, return error", async () => {
      const result = await interestRuleDA.insertNewInterestRule(
        undefined as any
      );

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when ruleID is empty, return error", async () => {
      const result = await interestRuleDA.insertNewInterestRule({
        ruleID: "",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is undefined, return error", async () => {
      const result = await interestRuleDA.insertNewInterestRule({
        ruleID: "rule1",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is negative, return error", async () => {
      const result = await interestRuleDA.insertNewInterestRule(
        createInterestRule("rule1", new Date("2024-01-01"), -0.01)
      );

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when interest rule date is empty, return error", async () => {
      const result = await interestRuleDA.insertNewInterestRule({
        ruleID: "rule1",
        rate: 0.01,
        date: undefined,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when interest rule already exists, return error", async () => {
      mockFileService.readFile.mockResolvedValue([
        ...mockInterestRules,
        createInterestRule("rule1", new Date("2024-01-01"), 0.01),
      ]);

      const result = await interestRuleDA.insertNewInterestRule(
        createInterestRule("rule1", new Date("2024-01-01"), 0.01)
      );

      expect(result).toEqual(
        createCustomErrorResult("Interest rule already exists")
      );
    });

    test("when interest rule is valid, return successful result", async () => {
      const newInterestRule: InterestRule = createInterestRule(
        "rule4",
        new Date("2024-01-03"),
        0.03
      );
      const updatedInterestRules = [...mockInterestRules, newInterestRule];
      const updatedRules = updatedInterestRules.map((rule) => ({
        ...rule,
        date: rule.date.toISOString(),
      }));

      mockFileService.readFile.mockResolvedValue(mockInterestRules);

      const result = await interestRuleDA.insertNewInterestRule(
        newInterestRule
      );

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedRules
      );
    });

    test("when saving new interest rule fails, return error", async () => {
      mockFileService.writeFile.mockRejectedValue("error");

      const result = await interestRuleDA.insertNewInterestRule(
        createInterestRule("rule7", new Date("2024-01-09"), 0.03)
      );

      expect(result).toEqual(createErrorResult("error"));
    });
  });

  describe("replaceInterestRateByDate_test", () => {
    test("when oldRule is undefined, return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        undefined as any,
        mockInterestRules[0],
        mockInterestRules
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when newRule is undefined, return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        undefined as any,
        mockInterestRules
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when rules is undefined, return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        mockInterestRules[1],
        undefined as any
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when rules is empty, return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        mockInterestRules[1],
        []
      );

      expect(result).toEqual(
        createCustomErrorResult("No interest rules found")
      );
    });

    test("when oldRule is not found, return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        createInterestRule("rule3", new Date("2024-01-03"), 0.03),
        createInterestRule("rule3", new Date("2024-01-03"), 0.03),
        mockInterestRules
      );

      expect(result).toEqual(
        createCustomErrorResult("Old interest rule not found")
      );
    });

    test("when replacing interest rule is successful, return successful result", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        createInterestRule("rule3", new Date("2024-01-03"), 0.03),
        mockInterestRules
      );

      expect(result).toEqual(createSuccessfulResult());
    });
  });

  describe("getInterestAllInterestRules_test", () => {
    test("when there is no interest rules, return empty array", async () => {
      mockFileService.readFile.mockResolvedValue([]);

      const result = await interestRuleDA.getAllInterestRules();

      expect(result).toEqual([]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when there are interest rules, return the interest rules", async () => {
      const result = await interestRuleDA.getAllInterestRules();

      expect(result).toEqual(mockInterestRules);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });
  });

  describe("saveInterestRules", () => {
    test("when saving rules with Date objects, convert and save to ISO strings", async () => {
      const dateObj = new Date("2024-03-20T00:00:00.000Z");
      const rules: InterestRule[] = [
        {
          ruleID: "Rule01",
          date: dateObj,
          rate: 0.05,
        },
      ];

      mockFileService.writeFile.mockResolvedValue(undefined);

      const interestRuleDA = new InterestRuleDA(new FileService());
      const result = await (interestRuleDA as any).saveInterestRules(rules);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        expect.arrayContaining([
          expect.objectContaining({
            ruleID: "Rule01",
            date: dateObj.toISOString(),
            rate: 0.05,
          }),
        ])
      );
    });

    test("when saving rules with ISO string dates, save the ISO strings", async () => {
      const isoString = "2024-03-20T00:00:00.000Z";
      const rules: InterestRule[] = [
        {
          ruleID: "Rule01",
          date: isoString as any,
          rate: 0.05,
        },
      ];

      mockFileService.writeFile.mockResolvedValue(undefined);

      const interestRuleDA = new InterestRuleDA(new FileService());
      const result = await (interestRuleDA as any).saveInterestRules(rules);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        expect.arrayContaining([
          expect.objectContaining({
            ruleID: "Rule01",
            date: isoString,
            rate: 0.05,
          }),
        ])
      );
    });
  });
});
