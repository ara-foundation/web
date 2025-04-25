import { ModuleCategory as BaseCategory, FileExtension } from "../module.js";
export declare enum ModuleCategory {
    NodeJsModule = "node_modules"
}
/**
 * @param url Usually an import clause, which is turned into the file
 */
export declare const urlToFileNames: (url: string, fileExtension?: FileExtension.Typescript) => string[];
/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path
 * @returns {ModuleCategory}
 */
export declare const identifyModuleType: (path: string) => Promise<ModuleCategory | BaseCategory>;
