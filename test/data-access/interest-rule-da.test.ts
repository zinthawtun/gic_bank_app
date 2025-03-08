import { InterestRule } from "@models/interest";
import { InterestRuleDA } from "@data-access/interest-rule-da";
import { FileService } from "@infrastructure/file-service";

import {
  createSuccessfulResult,
  createCustomErrorResult,
  createErrorResult,
} from "@utilities/result-helper";

const mockFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};

jest.mock("@infrastructure/file-service", () => ({
  FileService: jest.fn().mockImplementation(() => mockFileService),
}));

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("InterestRuleDA_Test", () => {
  let interestRuleDA: InterestRuleDA;
  const testFilePath = "@data/interest-rules.json";
  const mockInterestRules: InterestRule[] = [
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
    mockFileService.readFile.mockResolvedValue(mockInterestRules);
    mockFileService.writeFile.mockResolvedValue(undefined);

    interestRuleDA = new InterestRuleDA(new FileService());
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("createNewInterestRule_test", () => {
    test("when interest rule is empty, test should return error", async () => {
      const result = await interestRuleDA.createNewInterestRule(
        undefined as any
      );

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when ruleID is empty, test should return error", async () => {
      const result = await interestRuleDA.createNewInterestRule({
        ruleID: "",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is undefined, test should return error", async () => {
      const result = await interestRuleDA.createNewInterestRule({
        ruleID: "rule1",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when rate is negative, test should return error", async () => {
      const result = await interestRuleDA.createNewInterestRule({
        ruleID: "rule1",
        rate: -0.01,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when interest rule date is empty, test should return error", async () => {
      const result = await interestRuleDA.createNewInterestRule({
        ruleID: "rule1",
        rate: 0.01,
        date: undefined,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid interest rule"));
    });

    test("when interest rule already exists, test should return error", async () => {
      mockFileService.readFile.mockResolvedValue([
        ...mockInterestRules,
        { ruleID: "rule1", rate: 0.01, date: new Date("2024-01-01") },
      ]);

      const result = await interestRuleDA.createNewInterestRule({
        ruleID: "rule1",
        rate: 0.01,
        date: new Date("2024-01-01"),
      } as InterestRule);

      expect(result).toEqual(
        createCustomErrorResult("Interest rule already exists")
      );
    });

    test("when interest rule is valid, test should return successful result", async () => {
      const newInterestRule: InterestRule = {
        ruleID: "rule3",
        rate: 0.03,
        date: new Date("2024-01-03"),
      };
      const updatedInterestRules = [...mockInterestRules, newInterestRule];
      const result = await interestRuleDA.createNewInterestRule(
        newInterestRule
      );

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedInterestRules
      );
    });
  });

  describe("replaceInterestRateByDate_test", () => {
    test("when oldRule is undefined, test should return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        undefined as any,
        mockInterestRules[0],
        mockInterestRules
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when newRule is undefined, test should return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        undefined as any,
        mockInterestRules
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when rules is undefined, test should return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        mockInterestRules[1],
        undefined as any
      );

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when rules is empty, test should return error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        mockInterestRules[1],
        []
      );

      expect(result).toEqual(
        createCustomErrorResult("No interest rules found")
      );
    });

    test("when oldRule is not found, test should return  error", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        { ruleID: "rule3", rate: 0.03, date: new Date("2024-01-03") },
        { ruleID: "rule3", rate: 0.03, date: new Date("2024-01-03") },
        mockInterestRules
      );

      expect(result).toEqual(
        createCustomErrorResult("Old interest rule not found")
      );
    });

    test("when replacing interest rule is successful, test should return successful result", async () => {
      const result = await interestRuleDA.replaceInterestRule(
        mockInterestRules[0],
        { ruleID: "rule3", rate: 0.03, date: new Date("2024-01-03") },
        mockInterestRules
      );

      expect(result).toEqual(createSuccessfulResult());
    });
  });

  describe("getInterestAllInterestRules_test", () => {
    test("when there is no interest rules, test should return empty array", async () => {
      mockFileService.readFile.mockResolvedValue([]);

      const result = await interestRuleDA.getAllInterestRules();

      expect(result).toEqual([]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when there are interest rules, test should return the interest rules", async () => {
      const result = await interestRuleDA.getAllInterestRules();

      expect(result).toEqual(mockInterestRules);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });
  });

  describe("getInterestRules_test", () => {
    test("when there are interest rules, test should return the interest rules", async () => {
      const result = await (interestRuleDA as any).getInterestRules();

      expect(result).toEqual(mockInterestRules);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when there are no interest rules, test should return empty array", async () => {
      mockFileService.readFile.mockResolvedValue([]);

      const result = await (interestRuleDA as any).getInterestRules();

      expect(result).toEqual([]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });
  });

  describe("saveInterestRules_test", () => {
    test("when saving interest rules is successful, test should return successful result", async () => {
      const result = await (interestRuleDA as any).saveInterestRules(
        mockInterestRules
      );

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        mockInterestRules
      );
    });

    test("when saving interest rules fails, test should return error result", async () => {
      mockFileService.writeFile.mockRejectedValue("error");

      const result = await (interestRuleDA as any).saveInterestRules(
        mockInterestRules
      );

      expect(result).toEqual(createErrorResult("error"));
    });
  });
});
