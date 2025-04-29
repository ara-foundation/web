import { Result } from "@ara-web/ts-enhancement/result";
import { ModuleLink } from "@ara-web/ts-enhancement/module-link";
/**
 * Defualt Module Categories
 */
export declare enum ModuleCategory {
    Untracked = "untracked"
}
/**
 * Default supported file extentions
 */
export declare enum FileExtension {
    Typescript = ".ts",
    Javascript = ".js"
}
/**
 * Works with the file path. Anything related to your OS file system is going through here.
 */
export declare class FilePath {
    /**
     * Removes any special character prefixes:
     *  `./`
     *  `../`
     *  `@`
     * @param module path
     */
    static trimPath: (path: string) => string;
    /**
     * Detects the file type by the file extension,
     * if not supported file then returns error.
     * @param filePath the full path to the file within the Ara Web
     * @returns {FileExtension}
     */
    static getFileExtension: (filePath: string | undefined, supportedExtensions: string[]) => Result<string>;
    /**
     * Returns the file name
     * @param filePath
     * @returns
     */
    static getFileName: (filePath: string | undefined, includeExt?: boolean) => Promise<Result<string>>;
    static getCurrentWorkingDir: () => string;
    static isAbsolutePath: (dirOrFilePath: string) => boolean;
    static isDirectory: (filePath: string) => Promise<boolean>;
    /**
     * If the file path is a directory then simply return it.
     * Otherwise, return the file's .
     * @param dirOrfilePath
     */
    static getDirectory: (dirOrfilePath: string) => Promise<string>;
    static getFileAbsolutePath: (filePath: string, filePathFrom: string) => Promise<ModuleLink>;
    static join: (segments: string[]) => string;
    /**
     * Returns true if the file exists by given `moduleLink`.
     * For now it only supports the `file://` module URLs and in this case
     * checks the file system. The file must not be a directory also.
     * @param moduleLink
     */
    static isFileExist: (moduleLink: ModuleLink) => Promise<boolean>;
    /**
     * Reads the file content
     * @param filePath
     */
    static getFileContent: (filePath: string) => Promise<Result<string>>;
}
