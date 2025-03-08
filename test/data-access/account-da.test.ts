import { AccountDA } from "@data-access/account-da";
import { Account } from "@models/account";
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

describe("AccountDA_Test", () => {
  let accountDA: AccountDA;
  const testFilePath = "@data/accounts.json";
  const mockAccounts: Account[] = [
    {
      accountID: "acc1",

      balance: 100,
    },
    {
      accountID: "acc2",
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
      const result = await accountDA.getAccountByID("acc1");

      expect(result).toEqual(mockAccounts[0]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when accountID is not found, test should return undefined", async () => {
      const result = await accountDA.getAccountByID("acc3");

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
        accountID: "acc3",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is negative, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({
        accountID: "acc3",
        balance: -10,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when account already exists, test should return custom error", async () => {
      const result = await accountDA.createNewAccount({
        accountID: "acc1",
        balance: 100,
      } as any);

      expect(result).toEqual(createCustomErrorResult("Account already exists"));
    });

    test("when account is valid, test should have successful result and save the account", async () => {
      const account: Account = { accountID: "acc4", balance: 100 };
      const updatedMockAccounts = [...mockAccounts, account];
      const result = await accountDA.createNewAccount(account);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        updatedMockAccounts
      );
    });

    test("when save account fails, test should return error result", async () => {
      const account: Account = { accountID: "acc5", balance: 100 };
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
        accountID: "acc3",
      } as any);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when balance is negative, test should return error", async () => {
      const result = await accountDA.updateAccount({
        accountID: "acc3",
        balance: -10,
      } as Account);

      expect(result).toEqual(createCustomErrorResult("Invalid operation"));
    });

    test("when account is not found, test should return error", async () => {
      const result = await accountDA.updateAccount({
        accountID: "acc3",
        balance: 100,
      } as Account);

      expect(result).toEqual(createCustomErrorResult("Account not found"));
    });

    test("when account is valid, test should have successful result and save the account", async () => {
      const account: Account = { accountID: "acc1", balance: 500 };
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

  describe("getAccounts_test", () => {
    test("when file is empty, test should return empty array", async () => {
      mockFileService.readFile.mockResolvedValueOnce([]);
      const accounts = await (accountDA as any).getAccounts();

      expect(accounts).toEqual([]);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when file has accounts, test should return the accounts", async () => {
      const accounts = await (accountDA as any).getAccounts();

      expect(accounts).toEqual(mockAccounts);
      expect(mockFileService.readFile).toHaveBeenCalledWith(testFilePath);
    });

    test("when file read fails, test should throw error", async () => {
      mockFileService.readFile.mockRejectedValueOnce(
        new Error("File read error")
      );
      await expect((accountDA as any).getAccounts()).rejects.toThrow(
        "File read error"
      );
    });
  });

  describe("saveAccounts_test", () => {
    test("when saveAccounts is successful, test should return success result", async () => {
      const result = await (accountDA as any).saveAccounts(mockAccounts);

      expect(result).toEqual(createSuccessfulResult());
      expect(mockFileService.writeFile).toHaveBeenCalledWith(
        testFilePath,
        mockAccounts
      );
    });

    test("when save accounts fails, test should return error result", async () => {
      mockFileService.writeFile.mockRejectedValue("error");
      const result = await (accountDA as any).saveAccounts(mockAccounts);

      expect(result).toEqual(createErrorResult("error"));
    });
  });
});
