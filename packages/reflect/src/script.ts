import { type FileContent, globsToFileContents } from "./fileLevel.js";
import { trimPath } from "./module.js";

/**
 * @returns Returns the file contents of the path
 */
export const getScripts = async (): Promise<FileContent[]> => {
    // let globs = import.meta.glob('@scripts/**/*.ts', {eager: true})//relative to this component file

    // const fileContents = await globsToFileContents(globs);

    // return fileContents;
    return [];
}

/**
 * Try to get the script by the path name
 * @param {string} path to import the script
 * @returns {FileContent|Undefined}
 */
export const getScriptByPath = async (path: string): Promise<FileContent|undefined> => {
    path = trimPath(path);
    const scripts = await getScripts();
    for (let script of scripts) {
        if (script.filePath.indexOf(path + ".ts") > -1 || script.filePath.indexOf(path + "/index.ts") > -1) {
            return script;
        }
    }

    return undefined;
}