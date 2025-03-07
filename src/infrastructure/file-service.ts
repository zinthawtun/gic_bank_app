import fs from "fs";
import { Result } from "@models/result";
import { createSuccessfulResult, createErrorResult } from "@utilities/result-helper";

export class FileService {
    constructor(
        private readonly fsModule = fs
    ) {}

    public async readFile<T>(filePath: string): Promise<T> {
        try {
            if (!this.fsModule.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const content = await this.fsModule.promises.readFile(filePath, "utf-8");
            return JSON.parse(content);
        } catch (error) {
            throw error;
        }
    }

    public async writeFile<T>(filePath: string, data: T): Promise<Result> {
        try {
            await this.fsModule.promises.writeFile(filePath, JSON.stringify(data));
            return createSuccessfulResult();
        } catch (error: unknown) {
            return createErrorResult(error);
        }
    }
}