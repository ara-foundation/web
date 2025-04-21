import type { AstroNode } from "@ara-web/component-engine";
import type { ModuleType } from "./module.js";

export enum FileExtension {
    Astro = ".astro",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js",
    DirectoryOrUndefined = "",
}

/**
 * The content of any page will contain list of the nodes and code, usually a frontmatter.
 */
export type FileContent = {
    nodes?: AstroNode[], 
    source?: string,
    type: FileExtension,
    filePath: string,
    error?: string,
    glob?: unknown,
}

export type IdentifiedFileContent = {
    fileContent: FileContent,
    modulePath: string,
    moduleType: ModuleType,
}