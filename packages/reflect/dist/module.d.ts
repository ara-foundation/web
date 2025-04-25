export declare enum ModuleCategory {
    Untracked = "untracked"
}
export declare enum FileExtension {
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
