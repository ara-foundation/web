import { Debug, Result } from "@ara-web/ts-enhancement";
import { getNodejsModuleByPath } from "./enabled-nodejs-module.js";

export enum ModuleType {
    NodeJsModule = "node_modules",
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts",
    Untracked = "untracked", // If the given path is not part of reflection
}

export enum FileExtension {
    Astro = ".astro",
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
    return path.replace("./", "").replace("../", "").replace("@", "/src/")
}

/**
 * Converts the file name into a Url within the Ara Web
 * @param fileName a page
 */
export const fileNameToUrl = (fileName: string): string => {
    let index = fileName.indexOf("/index.astro");
    if (index > -1) {
        return fileName.substring(0, index)
    }

    return fileName.substring(0, fileName.indexOf(".astro"));
}

/**
 * @param url Usually an import clause, which is turned into the file
 */
export const urlToFileNames = (url: string, fileExtension?: FileExtension.Typescript): string[] => {
    const identifiedFileExtension = getFileExtension(url);
    if (identifiedFileExtension.isSuccess) {
        return [url];
    }
    
    if (fileExtension !== undefined) {
        return [url + fileExtension];
    }

    const urls: string[] = [];
    for (const ext in FileExtension) {
        const enumKey = ext as keyof typeof FileExtension
        const value = FileExtension[enumKey]

        if (typeof value === "string") {
            urls.push(url + FileExtension[enumKey])
        }
    }

    return urls;
}


/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path 
 * @returns {ModuleType}
 */
export const identifyModuleType = async (path: string): Promise<ModuleType> => {
    path = trimPath(path);
    if (path.indexOf(ModuleType.Script) > -1) {
        return ModuleType.Script;
    } 
    if (path.indexOf(ModuleType.Component) > -1) {
        return ModuleType.Component;
    } 
    if (path.indexOf(ModuleType.Page) > -1) {
        return ModuleType.Page;
    } 
    if (path.indexOf(ModuleType.Layout) > -1) {
        return ModuleType.Layout;
    } 
    Debug.push(`getNodejsModulePath()`, {path: path})
    const nodeJsModule = await getNodejsModuleByPath(path);
    Debug.pop();
    Debug.log(`Returned the node js module by path? ${nodeJsModule !== undefined}`)
    if (nodeJsModule !== undefined) {
        return ModuleType.NodeJsModule;
    }

    return ModuleType.Untracked;
}


/**
 * Detects the file type by the file extension, if not supported file then return PathType.DirectoryOrUndefined.
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
const getFileExtension = (filePath: string): Result<FileExtension> => {
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return Result.fail(
            `Extension not found in the given file path`,
            `The '${filePath}' file path doesn't have an extension`
        )
    }

    const extension = filePath.substring(extensionIndex);

    const pathTypes = Object.keys(FileExtension)
    for (const pathType of pathTypes) {
        const key = pathType as keyof typeof FileExtension;
        if (FileExtension[key] === extension) {
            return Result.ok(FileExtension[key]);
        }
    }

    return Result.fail(
        `The module's '${extension}' extension not supported`,
        `The '${filePath}' doesn't have recognized file extension`
    )
}
