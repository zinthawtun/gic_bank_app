import { handleInterestInputs } from "@handlers/interest-rule-handler";
import inquirer from "inquirer";
import chalk from "chalk";

jest.mock("inquirer");
jest.mock("chalk", () => ({
  red: jest.fn((str) => str),
  green: jest.fn((str) => str),
}));

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
let mockConsoleLog: jest.SpyInstance;

const mockInterestRuleService = {
  createNewInterestRule: jest.fn(),
};

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

  test("when input format is invalid, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid interest rule input");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid interest rule input");
    expect(result).toBe(true);
  });

  test("when date format is invalid, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "2024-03-21 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date format. Use YYYYMMdd");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Invalid date format. Use YYYYMMdd"
    );
    expect(result).toBe(true);
  });

  test("when date is over the end of month, should show error", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240231 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith("Invalid date");
    expect(mockConsoleLog).toHaveBeenCalledWith("Invalid date");
    expect(result).toBe(true);
  });

  test("when interest rate is not a number, should show error", async () => {
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

  test("when interest rate is not a number, should show error", async () => {
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

  test("when interest rule service returns error, should show error message", async () => {
    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });
    mockInterestRuleService.createNewInterestRule.mockRejectedValueOnce(
      new Error("Error message")
    );

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith(new Error("Error message"));
    expect(mockConsoleLog).toHaveBeenCalledWith(new Error("Error message"));
    expect(chalk.red).toHaveBeenCalledWith("Failed to create interest rule!");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Failed to create interest rule!"
    );
    expect(result).toBe(true);
  });

  test("when interest rule service returns error as result, should show error message", async () => {
    mockInterestRuleService.createNewInterestRule.mockRejectedValueOnce({
      errorMessage: "Result error message",
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: "20240321 Rule1 10" })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(chalk.red).toHaveBeenCalledWith({
      errorMessage: "Result error message",
    });
    expect(mockConsoleLog).toHaveBeenCalledWith({
      errorMessage: "Result error message",
    });
    expect(chalk.red).toHaveBeenCalledWith("Failed to create interest rule!");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Failed to create interest rule!"
    );
    expect(result).toBe(true);
  });

  test("when interest rule service returns result with error, should show error message and continue", async () => {
    const mockInput = "20240321 Rule2 11";
    mockInterestRuleService.createNewInterestRule.mockResolvedValueOnce({
      hasError: true,
      errorMessage: "Rule already exists"
    });

    mockInquirer.prompt
      .mockResolvedValueOnce({ input: mockInput })
      .mockResolvedValueOnce({ input: "" });

    const result = await handleInterestInputs();

    expect(mockInterestRuleService.createNewInterestRule).toHaveBeenCalledWith({
      ruleID: "Rule2",
      date: new Date(Date.UTC(2024, 2, 21)),
      rate: 11
    });
    expect(mockConsoleLog).toHaveBeenCalledWith("Rule already exists");
    expect(result).toBe(true);
  });

  test("when interest rule service is valid, should show success message", async () => {
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
