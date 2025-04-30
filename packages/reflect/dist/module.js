import PathModule from "node:path";
import { readFile, readFileSync, statSync, writeFileSync } from "node:fs";
import { Result, ModuleLink, OkResult } from "@ara-web/ts-enhancement";
/**
 * Defualt Module Categories
 */
export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["Untracked"] = "untracked";
})(ModuleCategory || (ModuleCategory = {}));
/**
 * Default supported file extentions
 */
export var FileExtension;
(function (FileExtension) {
    FileExtension["Typescript"] = ".ts";
    FileExtension["Javascript"] = ".js";
})(FileExtension || (FileExtension = {}));
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
    static trimPath = (path) => {
        return path.replace("../", "").replace("./", "").replace("@", "/src/");
    };
    static isFileExtensionExist = (filePath) => {
        if (filePath === undefined) {
            return false;
        }
        let extension = PathModule.extname(filePath);
        return (extension.length !== 0);
    };
    /**
     * Detects the file type by the file extension,
     * if not supported file then returns error.
     * @param filePath the full path to the file within the Ara Web
     * @returns {FileExtension}
     */
    static getFileExtension = (filePath, supportedExtensions) => {
        if (filePath === undefined) {
            return Result.fail(`The filepath is undefined`, `Are you sure your ModuleLink has the subpath?`);
        }
        let extension = PathModule.extname(filePath);
        if (extension.length === 0) {
            return Result.fail(`The file path has no file extension`, `Pass the corrent name to support ${filePath}`);
        }
        if (supportedExtensions === undefined) {
            return Result.ok(extension);
        }
        if (supportedExtensions.includes(extension)) {
            return Result.ok(extension);
        }
        return Result.fail(`The module's '${extension}' extension not supported`, `The '${filePath}' doesn't have recognized file extension`);
    };
    /**
     * Returns the file name
     * @param filePath
     * @returns
     */
    static getFileName = (filePath, includeExt = false) => {
        if (filePath === undefined) {
            return Result.fail(`File path is empty`, `Please pass the correct file name`);
        }
        if (this.isDirectory(filePath)) {
            return Result.fail(`The path is directory`, `The '${filePath}' is directory in the file system, no file name there`);
        }
        const segments = filePath.split(PathModule.sep);
        let fileName = segments[segments.length - 1];
        if (!includeExt) {
            fileName = fileName.substring(0, fileName.lastIndexOf("."));
        }
        return Result.ok(fileName);
    };
    static getCurrentWorkingDir = () => {
        return process.cwd();
    };
    static isAbsolutePath = (dirOrFilePath) => {
        return PathModule.isAbsolute(dirOrFilePath);
    };
    static isDirectory = (filePath) => {
        try {
            const stats = statSync(filePath);
            return stats.isDirectory();
        }
        catch (_) {
            return false;
        }
    };
    /**
     * If the file path is a directory then simply return it.
     * Otherwise, return the file's .
     * @param dirOrfilePath
     */
    static getDirectory = (dirOrfilePath) => {
        if (this.isDirectory(dirOrfilePath)) {
            return dirOrfilePath;
        }
        return PathModule.dirname(dirOrfilePath);
    };
    static getFileAbsolutePath = (filePath, filePathFrom) => {
        return ModuleLink.newFileURL(PathModule.resolve(this.getDirectory(filePathFrom), filePath));
    };
    static join = (segments) => {
        return PathModule.join(...segments);
    };
    /**
     * Returns true if the file exists by given `moduleLink`.
     * For now it only supports the `file://` module URLs and in this case
     * checks the file system. The file must not be a directory also.
     * @param moduleLink
     */
    static isFileExist = (moduleLink) => {
        if (!moduleLink.isFileURL) {
            return false;
        }
        try {
            const stats = statSync(moduleLink.toFilePath);
            return stats.isFile();
        }
        catch (_) {
            return false;
        }
    };
    /**
     * Writes the file content, to a new file.
     * @param filePath absolute file path.
     * @param fileContent data to write.
     */
    static postFileContent = (filePath, fileContent) => {
        try {
            writeFileSync(filePath, fileContent);
            return OkResult.ok();
        }
        catch (e) {
            return OkResult.fail(`Failed to write file at '${filePath}'`, `${e}`);
        }
    };
    /**
     * Reads the file content
     * @param filePath
     */
    static getFileContent = (filePath) => {
        try {
            const sourceBuffer = readFileSync(filePath);
            const source = sourceBuffer.toString();
            return Result.ok(source);
        }
        catch (e) {
            return Result.fail(`fs.readFile('${filePath}'): thrown exception`, `${e}`);
        }
    };
}
