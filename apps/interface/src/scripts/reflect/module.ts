import { Debug } from "@scripts/debug";
import { getNodejsModuleByPath } from "./enabledNodejsModule";

export enum ModuleType {
    NodeJsModule = "node_modules",
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts",
    Untracked = "untracked", // If the given path is not part of reflection
}

/**
 * 
 * @param path Removes all ., /, and @ special symbals from the path
 */
export const trimPath = (path: string): string => {
    return path.replace("./", "").replace("../", "").replace("@", "")
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
