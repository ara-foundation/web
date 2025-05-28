import PathModule from "node:path"
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { Result, OkResult } from "@ara-web/p-hintjens";
import { ModuleLink } from "@ara-web/sds";

/**
 * Defualt Module Categories
 */ 
export class ModulePath {
    private static getParentLevel = (callerSegments: string[], importSegments: string[]): number|undefined => {
        for (let segmentIndex = 0; segmentIndex < callerSegments.length; segmentIndex++) {
            const segment = callerSegments[segmentIndex];
            const lvlsUntilCaller = callerSegments.length - segmentIndex;
            if (segmentIndex >= importSegments.length) {
                return -1 * lvlsUntilCaller;
            }
            if (segment === importSegments[segmentIndex]) {
                continue;
            }
    
            const lvlsUntilImport = importSegments.length - segmentIndex;
            return -1 * (lvlsUntilCaller + lvlsUntilImport)
        }
    
        return undefined;
    }
    
    public static getFilenameOrIndex = (filePath: string, ext?: string) => {
        let importFilename = "index";
        if (!FilePath.isDirectory(filePath)) {
            importFilename = FilePath.getFileName(filePath).getValue();
        }
        if (ext !== undefined) {
            return importFilename + ext;
        }
        return importFilename;
    }

    public static getLevel = (callerFilePath: string, importFilePath: string): number|undefined => {
        const importDirectory = FilePath.getDirectory(importFilePath);
        const callerDirectory = FilePath.getDirectory(callerFilePath);
        
        const callerSegments = FilePath.getDirSegments(callerDirectory);
        const importSegments = FilePath.getDirSegments(importDirectory);
    
        // We are dealing with the child:
        // "./child/sub-child/index".subChild("./index") -> true
        if (importDirectory.startsWith(callerDirectory)) {
            return importSegments.length - callerSegments.length;
        }
        
        const parentLvl = this.getParentLevel(callerSegments, importSegments);
        if (parentLvl !== undefined) {
            return parentLvl;
        }
    
        if (importDirectory !== callerDirectory) {
            return undefined;
        }
    
        return 0;
    }

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

    public static isFileExtensionExist = (filePath: string|undefined): boolean => {
        if (filePath === undefined) {
            return false;
        }
        let extension = PathModule.extname(filePath)
        return (extension.length !== 0);
    }

    /**
     * Detects the file type by the file extension, 
     * if not supported file then returns error.
     * @param filePath the full path to the file within the Ara Web
     * @returns {FileExtension}
     */
    public static getFileExtension = (filePath: string|undefined, supportedExtensions?: string[]): Result<string> => {
        if (filePath === undefined) {
            return Result.fail(`The filepath is undefined`, `Are you sure your ModuleLink has the subpath?`)
        }
        let extension = PathModule.extname(filePath)
        if (extension.length === 0) {
            return Result.fail(`The file path has no file extension`, `Pass the corrent name to support ${filePath}`)
        }

        if (supportedExtensions === undefined) {
            return Result.ok(extension);
        }
        if (supportedExtensions.includes(extension)) {
            return Result.ok(extension);
        }

        return Result.fail(
            `The module's '${extension}' extension not supported`,
            `The '${filePath}' doesn't have recognized file extension`
        )
    }

    /**
     * Returns the file name
     * @param filePath 
     * @param includeExt? optinally set include the extension or not. By default set to false.
     * @returns 
     */
    public static getFileName = (filePath: string|undefined, includeExt: boolean = false): Result<string> => {
        if (filePath === undefined) {
            return Result.fail(`File path is empty`, `Please pass the correct file name`);
        }

        if (this.isDirectory(filePath)) {
            return Result.fail(`The path is directory`, `The '${filePath}' is directory in the file system, no file name there`)
        }

        const segments = filePath.split(PathModule.sep);
        let fileName = segments[segments.length - 1];
        if (!includeExt) {
            if (fileName.lastIndexOf(".") > -1) {
                fileName = fileName.substring(0, fileName.lastIndexOf("."))
            }
        }
        return Result.ok(fileName);
    }

    public static getCurrentWorkingDir = (): string => {
        return process.cwd();
    }

    public static isAbsolutePath = (dirOrFilePath: string): boolean => {
        return PathModule.isAbsolute(dirOrFilePath);
    }

    public static isDirectory = (filePath: string): boolean => {
        try {
            const stats = statSync(filePath);
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
    public static getDirectory = (dirOrfilePath: string): string => {
        if (this.isDirectory(dirOrfilePath)) {
            return dirOrfilePath;
        }

        return PathModule.dirname(dirOrfilePath);
    }

    public static getFileAbsolutePath = (filePath: string, filePathFrom: string): ModuleLink => {
        return ModuleLink.newFileLink(PathModule.resolve(this.getDirectory(filePathFrom), filePath));
    }

    /**
     * @param dirPath Directory without the file path
     * @returns 
     */
    public static getDirSegments = (dirPath: string): string[] => {
        return dirPath.split(PathModule.sep);
    }

    public static join = (segments: string[]): string => {
        return PathModule.join(...segments);
    }

    /**
     * Returns true if the file exists by given `moduleLink`.
     * For now it only supports the `file://` module URLs and in this case
     * checks the file system. The file must not be a directory also.
     * @param moduleLink 
     */
    public static isFileExist = (moduleLink: ModuleLink): boolean => {
        if (!moduleLink.isFileURL) {
            return false;
        }

        try {
            const stats = statSync(moduleLink.toAbsFilePath);
            return stats.isFile();
        } catch (_) {
            return false;
        }
    }

    /**
     * Writes the file content, to a new file.
     * @param filePath absolute file path.
     * @param fileContent data to write.
     */
    public static postFileContent = (filePath: string, fileContent: string): OkResult => {
        try {
            writeFileSync(filePath, fileContent)
            return OkResult.ok();
        } catch (e) {
            return OkResult.fail(`Failed to write file at '${filePath}'`, `${e}`)
        }
    }

    /**
     * Reads the file content
     * @param filePath 
     */
    public static getFileContent = (filePath: string): Result<string> => {
        try {
            const sourceBuffer = readFileSync(filePath);
            const source = sourceBuffer.toString();

            return Result.ok(source);
        } catch (e) {
            return Result.fail(`fs.readFile('${filePath}'): thrown exception`, `${e}`)
        }
    }

    public static getPackageJsonDependencies = (cwd: string = this.getCurrentWorkingDir(), fileName = 'package.json'): string[] => {
        try {
            const packageJsonFilePath = this.join([cwd, fileName]);
            const rawPackageSettings = this.getFileContent(packageJsonFilePath)
            if (rawPackageSettings.isFailure) {
                return [];
            }
            const packageJson = JSON.parse(rawPackageSettings.getValue()) as {
                dependencies?: Record<string, string>,
                devDependencies?: Record<string, string>,
                peerDependencies?: Record<string, string>,
            }

            const dependencies: string[] = [];

            if (packageJson.dependencies !== undefined) {
                dependencies.push(...Object.keys(packageJson.dependencies))
            }
            if (packageJson.devDependencies) {
                dependencies.push(...Object.keys(packageJson.devDependencies))
            }
            if (packageJson.peerDependencies) {
                dependencies.push(...Object.keys(packageJson.peerDependencies))
            }

            return dependencies;
        } catch (_) {
            return [];
        }
    }
}