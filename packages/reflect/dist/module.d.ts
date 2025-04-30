import { Result, ModuleLink, OkResult } from "@ara-web/ts-enhancement";
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
    static isFileExtensionExist: (filePath: string | undefined) => boolean;
    /**
     * Detects the file type by the file extension,
     * if not supported file then returns error.
     * @param filePath the full path to the file within the Ara Web
     * @returns {FileExtension}
     */
    static getFileExtension: (filePath: string | undefined, supportedExtensions?: string[]) => Result<string>;
    /**
     * Returns the file name
     * @param filePath
     * @returns
     */
    static getFileName: (filePath: string | undefined, includeExt?: boolean) => Result<string>;
    static getCurrentWorkingDir: () => string;
    static isAbsolutePath: (dirOrFilePath: string) => boolean;
    static isDirectory: (filePath: string) => boolean;
    /**
     * If the file path is a directory then simply return it.
     * Otherwise, return the file's .
     * @param dirOrfilePath
     */
    static getDirectory: (dirOrfilePath: string) => string;
    static getFileAbsolutePath: (filePath: string, filePathFrom: string) => ModuleLink;
    static join: (segments: string[]) => string;
    /**
     * Returns true if the file exists by given `moduleLink`.
     * For now it only supports the `file://` module URLs and in this case
     * checks the file system. The file must not be a directory also.
     * @param moduleLink
     */
    static isFileExist: (moduleLink: ModuleLink) => boolean;
    /**
     * Writes the file content, to a new file.
     * @param filePath absolute file path.
     * @param fileContent data to write.
     */
    static postFileContent: (filePath: string, fileContent: string) => OkResult;
    /**
     * Reads the file content
     * @param filePath
     */
    static getFileContent: (filePath: string) => Result<string>;
}
