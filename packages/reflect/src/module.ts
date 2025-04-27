import { Debug, Result } from "@ara-web/ts-enhancement";
import PathModule from "node:path"
import { readFile } from "node:fs/promises";

export enum ModuleCategory {
    Untracked = "untracked", // If the given path is not part of reflection
}

export enum FileExtension {
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js",
}

/**
 * Removes any special character prefixes:
 *  `./`
 *  `../`
 *  `@`
 * @param module path
 */
export const trimPath = (path: string): string => {
    return path.replace("../", "").replace("./", "").replace("@", "/src/")
}


/**
 * Detects the file type by the file extension, 
 * if not supported file then returns error.
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
export const getFileExtension = (filePath: string|undefined, supportedExtensions: string[]): Result<string> => {
    if (filePath === undefined) {
        return Result.fail(`The filepath is undefined`, `Are you sure your ModuleLink has the subpath?`)
    }
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return Result.fail(
            `Extension not found in the given file path`,
            `The '${filePath}' file path doesn't have an extension`
        )
    }

    const extension = filePath.substring(extensionIndex);

    if (supportedExtensions.includes(extension)) {
        return Result.ok(extension);
    }

    return Result.fail(
        `The module's '${extension}' extension not supported`,
        `The '${filePath}' doesn't have recognized file extension`
    )
}

export const getFileAbsolutePath = (filePath: string): string => {
    return process.cwd() + PathModule.resolve(filePath);
}

/**
 * Reads the file content
 * @param filePath 
 */
export const getFileContent = async (filePath: string): Promise<Result<string>> => {
    try {
        const sourceBuffer = await readFile(filePath);
        const source = sourceBuffer.toString();

        return Result.ok(source);
    } catch (e) {
        return Result.fail(`fs.readFile('${filePath}'): thrown exception`, `${e}`)
    }
}