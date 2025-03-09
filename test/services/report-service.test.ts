import { InterestRuleDA } from "@/data-access/interest-rule-da";
import { TransactionDA } from "@/data-access/transaction-da";
import { FileService } from "@/infrastructure/file-service";
import { Transaction, TransactionBalance } from "@/models/transaction";
import { ReportService } from "@/services/report-service";
import { createInterestRule, createTransaction } from "@test/scenario-helper";

const mockTransactionDA = {
  getTransactionsByAccountID: jest.fn(),
};

const mockInterestRuleDA = {
  getAllInterestRules: jest.fn(),
};

jest.mock("@/data-access/transaction-da", () => ({
  TransactionDA: jest.fn().mockImplementation(() => mockTransactionDA),
}));

jest.mock("@/data-access/interest-rule-da", () => ({
  InterestRuleDA: jest.fn().mockImplementation(() => mockInterestRuleDA),
}));

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("ReportService_Test", () => {
  let reportService: ReportService;
  const testAccountID = "Account1";
  const testDate = new Date("2024-03-01");
  const mockTransactions: Transaction[] = [
    createTransaction(
      "20240320-01",
      new Date("2024-02-20"),
      "Account1",
      "D",
      10
    ),
    createTransaction(
      "20240320-01",
      new Date("2024-03-20"),
      "Account1",
      "D",
      100
    ),
    createTransaction(
      "20240321-01",
      new Date("2024-03-21"),
      "Account1",
      "W",
      50
    ),
    createTransaction(
      "20240322-01",
      new Date("2024-03-22"),
      "Account1",
      "D",
      75
    ),
    createTransaction(
      "20240323-01",
      new Date("2024-03-23"),
      "Account1",
      "W",
      25
    ),
    createTransaction(
      "20240323-02",
      new Date("2024-03-23"),
      "Account1",
      "W",
      25
    ),
  ];

  const mockInterestRules = [
    createInterestRule("rule1", new Date("2024-01-01"), 1.1),
    createInterestRule("rule2", new Date("2024-03-21"), 2.3),
    createInterestRule("rule3", new Date("2024-03-22"), 9.5),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
      mockTransactions
    );
    mockInterestRuleDA.getAllInterestRules.mockResolvedValue([]);

    reportService = new ReportService(
      new TransactionDA(new FileService()),
      new InterestRuleDA(new FileService())
    );
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("runReport_test", () => {
    test("when no transaction found, return error", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue([]);
      const result = await reportService.runReport(testAccountID, testDate);

      expect(result.result.errorMessage).toEqual("No transaction found");
    });

    test("when no transaction found for the month, return error", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        mockTransactions
      );
      const result = await reportService.runReport(
        testAccountID,
        new Date("2024-04-01")
      );

      expect(result.result.errorMessage).toEqual(
        "No transaction found for the month"
      );
    });

    test("when no interest rule found, return zero interest", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        mockTransactions
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue([]);

      const result = await reportService.runReport(testAccountID, testDate);

      expect(result.calculatedAccountInterest).toEqual({
        accountID: testAccountID,
        amount: 0,
        date: new Date("2024-03-31"),
        type: "I",
      });
    });

    test("when interest rule found, return calculated interest", async () => {
      const expectedResultTransactions: TransactionBalance[] = [
        {
          balance: 110,
          transaction: createTransaction(
            "20240320-01",
            new Date("2024-03-20"),
            "Account1",
            "D",
            100
          ),
        },
        {
          balance: 60,
          transaction: createTransaction(
            "20240321-01",
            new Date("2024-03-21"),
            "Account1",
            "W",
            50
          ),
        },
        {
          balance: 135,
          transaction: createTransaction(
            "20240322-01",
            new Date("2024-03-22"),
            "Account1",
            "D",
            75
          ),
        },
        {
          balance: 110,
          transaction: createTransaction(
            "20240323-01",
            new Date("2024-03-23"),
            "Account1",
            "W",
            25
          ),
        },
        {
          balance: 85,
          transaction: createTransaction(
            "20240323-02",
            new Date("2024-03-23"),
            "Account1",
            "W",
            25
          ),
        },
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        mockTransactions
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await reportService.runReport(testAccountID, testDate);

      expect(result.calculatedAccountInterest).toEqual({
        accountID: testAccountID,
        amount: 90.18,
        date: new Date("2024-03-31"),
        type: "I",
      });
      expect(result.transactions.length).toEqual(5);
      expect(result.transactions).toEqual(expectedResultTransactions);
      expect(result.result.errorMessage).toBeUndefined();
    });

    test("when no previous interest rule exists, should use 0 as initial rate", async () => {
      const transactionsWithoutPreviousRule = [
        createTransaction(
          "20240320-01",
          new Date("2024-03-20"),
          "Account1",
          "D",
          100
        ),
      ];
      const interestRulesStartingInMarch = [
        createInterestRule("rule1", new Date("2024-03-21"), 2.3),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        transactionsWithoutPreviousRule
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        interestRulesStartingInMarch
      );

      const result = await reportService.runReport(
        testAccountID,
        new Date("2024-03-20")
      );
      expect(result.calculatedAccountInterest?.amount).toBe(25.3);
    });

    test("when multiple transactions occur on same day as interest rate change", async () => {
      const sameDataTransactions = [
        createTransaction(
          "20240321-01",
          new Date("2024-03-21"),
          "Account1",
          "D",
          100
        ),
        createTransaction(
          "20240321-02",
          new Date("2024-03-21"),
          "Account1",
          "D",
          50
        ),
      ];
      const interestRules = [
        createInterestRule("rule1", new Date("2024-03-21"), 2.3),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        sameDataTransactions
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(interestRules);

      const result = await reportService.runReport(testAccountID, testDate);
      expect(result.calculatedAccountInterest?.amount).toBe(37.95);
      expect(result.transactions.length).toBe(2);
      expect(result.transactions[1].balance).toBe(150);
    });

    test("when transactions are from different months but same year", async () => {
      const multiMonthTransactions = [
        createTransaction(
          "20240221-01",
          new Date("2024-02-21"),
          "Account1",
          "D",
          100
        ),
        createTransaction(
          "20240321-01",
          new Date("2024-03-21"),
          "Account1",
          "D",
          50
        ),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        multiMonthTransactions
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await reportService.runReport(testAccountID, testDate);
      expect(result.transactions.length).toBe(1);
      expect(result.transactions[0].balance).toBe(150);
    });

    test("when transaction DA returns null", async () => {
      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(null);
      const result = await reportService.runReport(testAccountID, testDate);
      expect(result.result.errorMessage).toBe("No transaction found");
    });

    test("when no interest rules exist", async () => {
      const singleDayTransaction = [
        createTransaction(
          "20240321-01",
          new Date("2024-03-21"),
          "Account1",
          "D",
          100
        ),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        singleDayTransaction
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue([]);

      const result = await reportService.runReport(testAccountID, testDate);
      expect(result.calculatedAccountInterest?.amount).toBe(0);
      expect(result.transactions.length).toBe(1);
    });

    test("when interest rules are not found before the current month", async () => {
      const transaction = [
        createTransaction(
          "20240301-01",
          new Date("2024-03-31"),
          "Account1",
          "D",
          100
        ),
      ];

      const interestRules = [
        createInterestRule("rule1", new Date("2024-04-21"), 2.3),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        transaction
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(interestRules);

      const result = await reportService.runReport(
        testAccountID,
        new Date("2024-03-01")
      );

      expect(result.calculatedAccountInterest?.amount).toBe(0);
      expect(result.transactions.length).toBe(1);
      expect(mockInterestRuleDA.getAllInterestRules).toHaveBeenCalledTimes(1);
    });

    test("when balance becomes zero within a day scenario", async () => {
      const zeroBalanceTransactions = [
        createTransaction(
          "20240320-01",
          new Date("2024-03-20"),
          "Account1",
          "D",
          100
        ),
        createTransaction(
          "20240320-02",
          new Date("2024-03-20"),
          "Account1",
          "W",
          100
        ),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        zeroBalanceTransactions
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(
        mockInterestRules
      );

      const result = await reportService.runReport(
        testAccountID,
        new Date("2024-03-20")
      );
      expect(result.transactions[1].balance).toBe(0);
      expect(result.calculatedAccountInterest?.amount).toBe(0);
    });

    test("when interest rules are provided in unsorted order", async () => {
      const transaction = [
        createTransaction(
          "20240301-01",
          new Date("2024-03-01"),
          "Account1",
          "D",
          100
        ),
      ];

      const unsortedRules = [
        createInterestRule("rule2", new Date("2024-03-20"), 3.5),
        createInterestRule("rule1", new Date("2024-03-15"), 2.3),
        createInterestRule("rule3", new Date("2024-02-28"), 1.1),
      ];

      mockTransactionDA.getTransactionsByAccountID.mockResolvedValue(
        transaction
      );
      mockInterestRuleDA.getAllInterestRules.mockResolvedValue(unsortedRules);

      const result = await reportService.runReport(testAccountID, testDate);

      expect(result.calculatedAccountInterest?.amount).toBe(68.9);
      expect(result.transactions.length).toBe(1);
    });

    test("when the input is future date", async () => {
      const futureDate = new Date("2024-12-01");
      const result = await reportService.runReport(testAccountID, futureDate);
      expect(result.result.errorMessage).toBe(
        "No transaction found for the month"
      );
    });
  });
});
