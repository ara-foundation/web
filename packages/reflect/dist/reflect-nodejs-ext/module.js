import { Debug, Result } from "@ara-web/ts-enhancement";
import { EnabledNodejsModules } from "./enabled-nodejs-module.js";
import { ModuleCategory as BaseCategory, FileExtension, trimPath } from "@ara-web/reflect";
export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["NodeJsModule"] = "node_modules";
})(ModuleCategory || (ModuleCategory = {}));
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
 * @returns {ModuleCategory}
 */
export const identifyModuleType = async (path) => {
    path = trimPath(path);
    Debug.push(`getNodejsModulePath()`, { path: path });
    const nodeJsModule = await EnabledNodejsModules.getNodejsModuleByPath(path);
    Debug.pop();
    Debug.log(`Returned the node js module by path? ${nodeJsModule !== undefined}`);
    if (nodeJsModule !== undefined) {
        return ModuleCategory.NodeJsModule;
    }
    return BaseCategory.Untracked;
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
