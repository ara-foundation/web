import { Debug, Result } from "@ara-web/ts-enhancement";
import { EnabledNodejsModules } from "./enabled-nodejs-module.js";
export var ModuleType;
(function (ModuleType) {
    ModuleType["NodeJsModule"] = "node_modules";
    ModuleType["Script"] = "scripts";
    ModuleType["Component"] = "components";
    ModuleType["Page"] = "pages";
    ModuleType["Layout"] = "layouts";
    ModuleType["Untracked"] = "untracked";
})(ModuleType || (ModuleType = {}));
export var FileExtension;
(function (FileExtension) {
    FileExtension["Astro"] = ".astro";
    FileExtension["Tsx"] = ".tsx";
    FileExtension["Jsx"] = ".jsx";
    FileExtension["Typescript"] = ".ts";
    FileExtension["Javascript"] = ".js";
})(FileExtension || (FileExtension = {}));
/**
 * Removes any special character prefixes:
 *  `./`
 *  `../`
 *  `@`
 * @param module path
 */
export const trimPath = (path) => {
    return path.replace("./", "").replace("../", "").replace("@", "/src/");
};
/**
 * Converts the file name into a Url within the Ara Web
 * @param fileName a page
 */
export const fileNameToUrl = (fileName) => {
    let index = fileName.indexOf("/index.astro");
    if (index > -1) {
        return fileName.substring(0, index);
    }
    return fileName.substring(0, fileName.indexOf(".astro"));
};
/**
 * @param url Usually an import clause, which is turned into the file
 */
export const urlToFileNames = (url, fileExtension) => {
    const identifiedFileExtension = getFileExtension(url);
    if (identifiedFileExtension.isSuccess) {
        return [url];
    }
    if (fileExtension !== undefined) {
        return [url + fileExtension];
    }
    const urls = [];
    for (const ext in FileExtension) {
        const enumKey = ext;
        const value = FileExtension[enumKey];
        if (typeof value === "string") {
            urls.push(url + FileExtension[enumKey]);
        }
    }
    return urls;
};
/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path
 * @returns {ModuleType}
 */
export const identifyModuleType = async (path) => {
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
    Debug.push(`getNodejsModulePath()`, { path: path });
    const nodeJsModule = await EnabledNodejsModules.getNodejsModuleByPath(path);
    Debug.pop();
    Debug.log(`Returned the node js module by path? ${nodeJsModule !== undefined}`);
    if (nodeJsModule !== undefined) {
        return ModuleType.NodeJsModule;
    }
    return ModuleType.Untracked;
};
/**
 * Detects the file type by the file extension, if not supported file then return PathType.DirectoryOrUndefined.
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
const getFileExtension = (filePath) => {
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return Result.fail(`Extension not found in the given file path`, `The '${filePath}' file path doesn't have an extension`);
    }
    const extension = filePath.substring(extensionIndex);
    const pathTypes = Object.keys(FileExtension);
    for (const pathType of pathTypes) {
        const key = pathType;
        if (FileExtension[key] === extension) {
            return Result.ok(FileExtension[key]);
        }
    }
    return Result.fail(`The module's '${extension}' extension not supported`, `The '${filePath}' doesn't have recognized file extension`);
};
// Moved from fileLevel.js and used by the UILevel and Astro page detection
// /**
//  * @returns Returns the file contents of the path
//  */
// export const getScripts = async (): Promise<UiContent[]> => {
//     // let globs = import.meta.glob('@scripts/**/*.ts', {eager: true})//relative to this component file
//     // const fileContents = await globsToFileContents(globs);
//     // return fileContents;
//     return [];
// }
