import fs from "fs";
import path from "path";

import { Result } from "@models/result";

import {
  createSuccessfulResult,
  createErrorResult,
} from "@utilities/result-helper";

export class FileService {
  constructor(private readonly fsModule = fs) {}

  private resolvePath(filePath: string): string {
    if (filePath.startsWith("@")) {
      return path.join(process.cwd(), filePath.substring(1));
    }
    return filePath;
  }

  private ensureFileExists(filePath: string): void {
    if (!this.fsModule.existsSync(filePath)) {
      this.fsModule.writeFileSync(filePath, "[]", { encoding: "utf8" });
    }
  }

  public async readFile<T>(filePath: string): Promise<T> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      this.ensureFileExists(resolvedPath);

      const content = await this.fsModule.promises.readFile(resolvedPath, {
        encoding: "utf8",
      });
      return JSON.parse(content.trim());
    } catch (error) {
      if (error instanceof SyntaxError) {
        await this.writeFile(filePath, [] as any);
        return [] as any;
      }
      throw error;
    }
  }

  public async writeFile<T>(filePath: string, data: T): Promise<Result> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await this.fsModule.promises.writeFile(
        resolvedPath,
        JSON.stringify(data, null, 2),
        { encoding: "utf8" }
      );
      return createSuccessfulResult();
    } catch (error: unknown) {
      return createErrorResult(error);
    }
  }
}
