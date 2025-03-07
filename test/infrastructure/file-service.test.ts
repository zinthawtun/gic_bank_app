import fs from "fs";
import { FileService } from "@infrastructure/file-service";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe("FileService_Test", () => {
  let fileService: FileService;

  beforeEach(() => {
    jest.clearAllMocks();
    fileService = new FileService();
  });

  describe("readFile_test", () => {
    test("file path does not exist", async () => {
      const filePath = "invalid_path.json";
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(fileService.readFile(filePath)).rejects.toThrow(
        `File not found: ${filePath}`
      );
    });

    test("successfully read the file", async () => {
      const filePath = "valid_path.json";
      const mockData = { test: "data" };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      const result = await fileService.readFile(filePath);
      expect(result).toEqual(mockData);
    });

    test("has JSON parse error and throw the error message", async () => {
      const filePath = "invalid_json.json";

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue("invalid json");

      await expect(fileService.readFile(filePath)).rejects.toThrow();
    });
  });

  describe("writeFile_test", () => {
    test("when write fails with non-Error type, return unknown error", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };

      (fs.promises.writeFile as jest.Mock).mockRejectedValue("string error");

      const result = await fileService.writeFile(filePath, mockData);
      expect(result).toEqual({
        isSuccess: false,
        hasError: true,
        errorMessage: "Unknown error occurred",
      });
    });

    test("when write fails with Error type, return error message", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };
      const mockError = new Error("Write failed");

      (fs.promises.writeFile as jest.Mock).mockRejectedValue(mockError);

      const result = await fileService.writeFile(filePath, mockData);
      expect(result).toEqual({
        isSuccess: false,
        hasError: true,
        errorMessage: mockError.message,
      });
    });

    test("successfully write the file", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };

      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await fileService.writeFile(filePath, mockData);
      expect(result).toEqual({
        isSuccess: true,
        hasError: false,
        errorMessage: undefined,
      });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockData)
      );
    });
  });
});
