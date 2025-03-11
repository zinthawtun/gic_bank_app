import { AccountDA } from "@data-access/account-da";

import { Account } from "@models/account";

import {
  createSuccessfulResult,
  createCustomErrorResult,
  createErrorResult,
} from "@utilities/result-helper";

import { FileService } from "@infrastructure/file-service";

const mockFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

jest.mock("@infrastructure/file-service", () => ({
  FileService: jest.fn().mockImplementation(() => mockFileService),
}));

describe("AccountDA_Test", () => {
  let accountDA: AccountDA;
  const testFilePath = "@data/accounts.json";
  const mockAccounts: Account[] = [
    {
      accountID: "Account1",

      balance: 100,
    },
    {
      accountID: "Account2",
      balance: 50,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileService.readFile.mockResolvedValue(mockAccounts);
    mockFileService.writeFile.mockResolvedValue(undefined);

    accountDA = new AccountDA(new FileService());
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe("getAccountByID_test", () => {
    test("when accountID is empty, test should return undefined", async () => {
      const result = await accountDA.getAccountByID("");

      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is null, test should return undefined", async () => {
      const result = await accountDA.getAccountByID(null as any);

      expect(result).toBeUndefined();
      expect(mockFileService.readFile).not.toHaveBeenCalled();
    });

    test("when accountID is valid, test should return the account", async () => {
      const result = await accountDA.getAccountByID("Account1");

      expect(result).toEqual(mockAccounts[0]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when accountID is not found, test should return undefined", async () => {
      const result = await accountDA.getAccountByID("Account3");

      expect(result).toBeUndefined();
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });
  });

  describe("createNewAccount_test", () => {
    test("when account is empty, test should return custom error", async () => {
      const result = await accountDA.createNewAccount(undefined as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when accountID is empty, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({ accountID: "" } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is undefined, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({
        accountID: "Account3",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is negative, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({
        accountID: "Account3",
        balance: -10,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when account already exists, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({
        accountID: "Account1",
        balance: 100,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Account already exists"));
    });

    test("when account is valid, test should have successful result and save the account", async () => {
      const account: Account = { accountID: "Account4", balance: 100 };
      const updatedMockAccounts = [...mockAccounts, account];
      const result = await accountDA.createNewAccount(account);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedMockAccounts
      );
    });

    test("when save account fails, test should return error result", async () => {
      const account: Account = { accountID: "Account5", balance: 100 };
      mockFileService.writeFile.mockRejectedValue("error");
      const result = await accountDA.createNewAccount(account);

      expect(result).toEqual(createErrorResult("error"));
    });
  });

  describe("updateAccount_test", () => {
    test("when account is empty, test should return error", async () => {
      const result = await accountDA.updateAccount(undefined as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when accountID is empty, test should return error", async () => {
      const result = await accountDA.updateAccount({ accountID: "" } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is undefined, test should return error", async () => {
      const result = await accountDA.updateAccount({
        accountID: "Account3",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is negative, test should return error", async () => {
      const result = await accountDA.updateAccount({
        accountID: "Account3",
        balance: -10,
      } as Account);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when account is not found, test should return error", async () => {
      const result = await accountDA.updateAccount({
        accountID: "Account3",
        balance: 100,
      } as Account);

      expect(result).toEqual(createCustomErrorResult("Account not found"));
    });

    test("when account is valid, test should have successful result and save the account", async () => {
      const account: Account = { accountID: "Account1", balance: 500 };
      const updatedMockAccounts = [...mockAccounts];
      const mockIndex = updatedMockAccounts.findIndex(
        (a) => a.accountID === account.accountID
      );
      updatedMockAccounts[mockIndex] = account;
      const result = await accountDA.updateAccount(account);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedMockAccounts
      );
    });
  });
});
