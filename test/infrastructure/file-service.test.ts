import fs from "fs";
import path from "path";

import {
  createErrorResult,
  createSuccessfulResult,
} from "@utilities/result-helper";

import { FileService } from "@infrastructure/file-service";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
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

  describe("path resolution", () => {
    test("when path has @ prefix, return the resolved path", async () => {
      const filePath = "@data/test.json";
      const expectedPath = path.join(process.cwd(), "data/test.json");
      const mockData = { test: "data" };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      await fileService.readFile(filePath);

      expect(fs.promises.readFile).toHaveBeenCalledWith(expectedPath, {
        encoding: "utf8",
      });
    });

    test("when path does not have @ prefix, return the original path", async () => {
      const filePath = "data/test.json";
      const mockData = { test: "data" };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      await fileService.readFile(filePath);

      expect(fs.promises.readFile).toHaveBeenCalledWith(filePath, {
        encoding: "utf8",
      });
    });
  });

  describe("file existence", () => {
    test("when file does not exist, create file with empty array", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      await fileService.readFile(filePath);

      expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, "[]", {
        encoding: "utf8",
      });
    });

    test("when file exists, return the file content", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      await fileService.readFile(filePath);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("readFile_test", () => {
    test("when file content has whitespace, return the trimmed content", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };
      const contentWithWhitespace = `\n  ${JSON.stringify(mockData)}  \n`;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        contentWithWhitespace
      );

      const result = await fileService.readFile(filePath);
      expect(result).toEqual(mockData);
    });

    test("when file content is invalid JSON, return an empty array", async () => {
      const filePath = "test.json";
      const invalidJson = "invalid json";

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(invalidJson);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await fileService.readFile(filePath);

      expect(result).toEqual([]);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify([], null, 2),
        { encoding: "utf8" }
      );
    });

    test("when file read fails, throw the error", async () => {
      const filePath = "test.json";
      const mockError = new Error("Read error");

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockRejectedValue(mockError);

      await expect(fileService.readFile(filePath)).rejects.toThrow(mockError);
    });
  });

  describe("writeFile_test", () => {
    test("when write succeeds, return a successful result", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };

      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await fileService.writeFile(filePath, mockData);

      expect(result).toEqual(createSuccessfulResult());
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockData, null, 2),
        { encoding: "utf8" }
      );
    });

    test("when write fails, return an error result", async () => {
      const filePath = "test.json";
      const mockData = { test: "data" };
      const mockError = new Error("Write failed");

      (fs.promises.writeFile as jest.Mock).mockRejectedValue(mockError);

      const result = await fileService.writeFile(filePath, mockData);
      expect(result).toEqual(createErrorResult(mockError));
    });
  });
});
