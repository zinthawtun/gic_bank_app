import { FilePaths } from "@config/constants";

import { Account } from "@models/account";
import { Result } from "@models/result";

import {
  createSuccessfulResult,
  createErrorResult,
  createCustomErrorResult,
} from "@utilities/result-helper";

import { FileService } from "@infrastructure/file-service";

const accountFilePath = FilePaths.ACCOUNTS;

export class AccountDA {
  private fileService: FileService;
  constructor(fileService: FileService) {
    this.fileService = fileService;
  }

  public async getAccountByID(accountID: string): Promise<Account | undefined> {
    if (!accountID) {
      return undefined;
    }

    const accounts = await this.getAccounts();

    return accounts.find((a) => a.accountID === accountID);
  }

  public async createNewAccount(account: Account): Promise<Result> {
    if (
      !account ||
      !account.accountID ||
      account.balance === undefined ||
      account.balance < 0
    ) {
      return createCustomErrorResult("Invalid operation");
    }

    const accounts = await this.getAccounts();
    const accountIDs = new Set(accounts.map((a) => a.accountID));

    if (accountIDs.has(account.accountID)) {
      return createCustomErrorResult("Account already exists");
    }

    accounts.push(account);

    return await this.saveAccounts(accounts);
  }

  public async updateAccount(account: Account): Promise<Result> {
    if (
      !account ||
      !account.accountID ||
      account.balance === undefined ||
      account.balance < 0
    ) {
      return createCustomErrorResult("Invalid operation");
    }

    const accounts = await this.getAccounts();
    const accountIndex = accounts.findIndex(
      (a) => a.accountID === account.accountID
    );

    if (accountIndex === -1) {
      return createCustomErrorResult("Account not found");
    }

    accounts[accountIndex] = account;

    return await this.saveAccounts(accounts);
  }

  private async getAccounts(): Promise<Account[]> {
    return this.fileService.readFile<Account[]>(accountFilePath);
  }

  private async saveAccounts(accounts: Account[]): Promise<Result> {
    try {
      await this.fileService.writeFile(accountFilePath, accounts);

      return createSuccessfulResult();
    } catch (error) {
      return createErrorResult(error);
    }
  }
}
