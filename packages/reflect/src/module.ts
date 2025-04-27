export enum ModuleCategory {
    Untracked = "untracked", // If the given path is not part of reflection
}

export enum FileExtension {
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
    return path.replace("../", "").replace("./", "").replace("@", "/src/")
}
