export declare enum ModuleType {
    NodeJsModule = "node_modules",
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts",
    Untracked = "untracked"
}
export declare enum FileExtension {
    Astro = ".astro",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js"
}
/**
 * Removes any special character prefixes:
 *  `./`
 *  `../`
 *  `@`
 * @param module path
 */
export declare const trimPath: (path: string) => string;
/**
 * Converts the file name into a Url within the Ara Web
 * @param fileName a page
 */
export declare const fileNameToUrl: (fileName: string) => string;
/**
 * @param url Usually an import clause, which is turned into the file
 */
export declare const urlToFileNames: (url: string, fileExtension?: FileExtension.Typescript) => string[];
/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path
 * @returns {ModuleType}
 */
export declare const identifyModuleType: (path: string) => Promise<ModuleType>;
