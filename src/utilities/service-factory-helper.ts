import { InterestRuleDA } from "@data-access/interest-rule-da";
import { TransactionDA } from "@data-access/transaction-da";
import { AccountDA } from "@data-access/account-da";

import { FileService } from "@infrastructure/file-service";

import { InterestRuleService } from "@services/interest-rule-service";
import { ReportService } from "@services/report-service";
import { TransactionService } from "@services/transaction-service";

export const createInterestRuleService = (): InterestRuleService => {
  const fileService = new FileService();
  const interestRuleDA = new InterestRuleDA(fileService);
  return new InterestRuleService(interestRuleDA);
};

export const createReportService = (): ReportService => {
  const fileService = new FileService();
  const transactionDA = new TransactionDA(fileService);
  const interestRuleDA = new InterestRuleDA(fileService);
  return new ReportService(transactionDA, interestRuleDA);
};

export const createTransactionService = (): TransactionService => {
  const fileService = new FileService();
  const transactionDA = new TransactionDA(fileService);
  const accountDA = new AccountDA(fileService);
  return new TransactionService(accountDA, transactionDA);
};
