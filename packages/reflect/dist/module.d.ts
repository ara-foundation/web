import { Result } from "@ara-web/ts-enhancement";
export declare enum ModuleCategory {
    Untracked = "untracked"
}
export declare enum FileExtension {
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js"
}
/**
 * Removes any special character prefixes:
 *  `./`
 *  `../`
 *  `@`
 * @param module path
 */
export declare const trimPath: (path: string) => string;
/**
 * Detects the file type by the file extension,
 * if not supported file then returns error.
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
export declare const getFileExtension: (filePath: string | undefined, supportedExtensions: string[]) => Result<string>;
export declare const getFileAbsolutePath: (filePath: string) => string;
/**
 * Reads the file content
 * @param filePath
 */
export declare const getFileContent: (filePath: string) => Promise<Result<string>>;
