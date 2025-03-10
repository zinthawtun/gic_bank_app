import inquirer from "inquirer";
import chalk from "chalk";

import { ValidationMessages } from "@config/constants";

import { handleInterestInputs } from "@handlers/interest-rule-handler";

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
const mockInterestRuleService = {
  createNewInterestRule: jest.fn(),
};
let mockConsoleLog: jest.SpyInstance;

jest.mock("inquirer");
jest.mock("chalk", () => ({
  red: jest.fn((str) => str),
  green: jest.fn((str) => str),
}));
jest.mock("@services/interest-rule-service", () => ({
  InterestRuleService: jest
    .fn()
    .mockImplementation(() => mockInterestRuleService),
}));

describe("handleInterestInputs_Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    mockInquirer.prompt.mockResolvedValue({ input: "" });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  test("when input is empty, should exit", async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(result).toBe(true);
  });

  test("when input format is invalid, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid interest rule input");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid interest rule input");
    expect(result).toBe(true);
  });

  test("when date format is invalid, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "2024-03-21 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE_FORMAT
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE_FORMAT
    );
    expect(result).toBe(true);
  });

  test("when date is over the end of month, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240231 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(ValidationMessages.INVALID_DATE);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_DATE
    );
    expect(result).toBe(true);
  });

  test("when rule ID is longer than 21 characters, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({
        input: "20240321 Rule1LongerThan21Characters 10",
      })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      ValidationMessages.INVALID_INTEREST_ID_LENGTH
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      ValidationMessages.INVALID_INTEREST_ID_LENGTH
    );
    expect(result).toBe(true);
  });

  test("when interest rate is not a number, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 Rule1 abc" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "Invalid interest rate (must be between 0 and 100)"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Invalid interest rate (must be between 0 and 100)"
    );
    expect(result).toBe(true);
  });

  test("when interest rate is not a number, return error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 Rule1 1000" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "Invalid interest rate (must be between 0 and 100)"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Invalid interest rate (must be between 0 and 100)"
    );
    expect(result).toBe(true);
  });

  test("when interest rule service throws an error, return proper error message", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });
    mockInterestRuleService.createNewInterestRule.mockRejectedValueOnce(
      "An unexpected error occurred while processing the interest rule"
    );

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the interest rule"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the interest rule"
    );
    expect(result).toBe(true);
  });

  test("when error is instanceof Error", async () => {
    const mockInput = "20240321 Rule1 10";
    mockInterestRuleService.createNewInterestRule.mockRejectedValueOnce(
      new Error(
        "An unexpected error occurred while processing the interest rule"
      )
    );

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: mockInput })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the interest rule"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "An unexpected error occurred while processing the interest rule"
    );
    expect(result).toBe(true);
  });

  test("when interest rule service returns result with error, return error message and continue", async () => {
    const mockInput = "20240321 Rule2 11";
    mockInterestRuleService.createNewInterestRule.mockResolvedValueOnce({
      hasError: true,
      errorMessage: "Rule already exists",
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: mockInput })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(mockInterestRuleService.createNewInterestRule).toHaveBeenCalledWith({
      ruleID: "Rule2",
      date: new Date(Date.UTC(2024, 2, 21)),
      rate: 11,
    });
    expect(mockConsoleLog).toHaveBeenCalledWith("Rule already exists");
    expect(result).toBe(true);
  });

  test("when interest rule service is valid, return success message", async () => {
    const mockInput = "20240321 Rule2 11";
    mockInterestRuleService.createNewInterestRule.mockResolvedValueOnce({
      hasError: false,
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: mockInput })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(mockInterestRuleService.createNewInterestRule).toHaveBeenCalledWith({
      ruleID: "Rule2",
      date: new Date(Date.UTC(2024, 2, 21)),
      rate: 11,
    });
    expect(chalk.green).toHaveBeenCalledWith(
      "Interest rule created successfully!"
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Interest rule created successfully!"
    );
    expect(result).toBe(true);
  });
});
