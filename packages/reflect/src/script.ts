import { type UiContent, globsToFileContents } from "./fileLevel.js";
import { trimPath } from "./module.js";

/**
 * @returns Returns the file contents of the path
 */
export const getScripts = async (): Promise<UiContent[]> => {
    // let globs = import.meta.glob('@scripts/**/*.ts', {eager: true})//relative to this component file

    // const fileContents = await globsToFileContents(globs);

    // return fileContents;
    return [];
}

/**
 * Try to get the script by the path name
 * @param {string} path to import the script
 * @returns {UiContent|Undefined}
 */
export const getScriptByPath = async (path: string): Promise<UiContent|undefined> => {
    path = trimPath(path);
    const scripts = await getScripts();
    for (let script of scripts) {
        if (script.filePath.indexOf(path + ".ts") > -1 || script.filePath.indexOf(path + "/index.ts") > -1) {
            return script;
        }
    }

    return undefined;
}