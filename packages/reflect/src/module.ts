import { Result } from "@ara-web/ts-enhancement";
import PathModule from "node:path"
import { readFile, stat } from "node:fs/promises";
import { ModuleLink } from "./ara-link/ModuleLink.js";

/**
 * Defualt Module Categories
 */ 
export enum ModuleCategory {
    Untracked = "untracked", // If the given path is not part of reflection
}

/**
 * Default supported file extentions
 */ 
export enum FileExtension {
    Typescript = ".ts",
    Javascript = ".js",
}

/**
 * Works with the file path. Anything related to your OS file system is going through here.
 */
export class FilePath {
    /**
     * Removes any special character prefixes:
     *  `./`
     *  `../`
     *  `@`
     * @param module path
     */
    public static trimPath = (path: string): string => {
        return path.replace("../", "").replace("./", "").replace("@", "/src/")
    }

    /**
     * Detects the file type by the file extension, 
     * if not supported file then returns error.
     * @param filePath the full path to the file within the Ara Web
     * @returns {FileExtension}
     */
    public static getFileExtension = (filePath: string|undefined, supportedExtensions: string[]): Result<string> => {
        if (filePath === undefined) {
            return Result.fail(`The filepath is undefined`, `Are you sure your ModuleLink has the subpath?`)
        }
        let extName = PathModule.extname(filePath)
        if (extName.length === 0) {
            return Result.fail(`The file path has no file extension`, `Pass the corrent name to support ${filePath}`)
        }

        const extension = '.' + extName;

        if (supportedExtensions.includes(extension)) {
            return Result.ok(extension);
        }

        return Result.fail(
            `The module's '${extension}' extension not supported`,
            `The '${filePath}' doesn't have recognized file extension`
        )
    }

    public static getCurrentWorkingDir = (): string => {
        return process.cwd();
    }

    public static isDirectory = async (filePath: string): Promise<boolean> => {
        try {
            const stats = await stat(filePath);
            return stats.isDirectory();
        } catch (_) {
            return false;
        }
    }

    /**
     * If the file path is a directory then simply return it.
     * Otherwise, return the file's .
     * @param dirOrfilePath 
     */
    public static getDirectory = async (dirOrfilePath: string): Promise<string> => {
        if (await this.isDirectory(dirOrfilePath)) {
            return dirOrfilePath;
        }

        return PathModule.dirname(dirOrfilePath);
    }

    public static getFileAbsolutePath = async(filePath: string, filePathFrom: string): Promise<ModuleLink> => {
        return ModuleLink.newFileURL(PathModule.resolve(await this.getDirectory(filePathFrom), filePath));
    }

    /**
     * Returns true if the file exists by given `moduleLink`.
     * For now it only supports the `file://` module URLs and in this case
     * checks the file system. The file must not be a directory also.
     * @param moduleLink 
     */
    public static isFileExist = async (moduleLink: ModuleLink): Promise<boolean> => {
        if (!moduleLink.isFileURL) {
            return false;
        }

        try {
            const stats = await stat(moduleLink.toFilePath);
            return stats.isFile();
        } catch (_) {
            return false;
        }
    }

    /**
     * Reads the file content
     * @param filePath 
     */
    public static getFileContent = async (filePath: string): Promise<Result<string>> => {
        try {
            const sourceBuffer = await readFile(filePath);
            const source = sourceBuffer.toString();

            return Result.ok(source);
        } catch (e) {
            return Result.fail(`fs.readFile('${filePath}'): thrown exception`, `${e}`)
        }
    }
}