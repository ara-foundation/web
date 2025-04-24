import { ModuleType } from "../module.js";
import { Result } from "@ara-web/ts-enhancement";
import type { AstroNode } from "@ara-web/component-engine";
export declare enum FileExtension {
    Astro = ".astro",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js",
    DirectoryOrUndefined = ""
}
/**
 * The content of any page will contain list of the nodes and code, usually a frontmatter.
 * Component nodes and source code splitted
 */
export type UiContent = {
    elements?: AstroNode[];
    source?: string;
    fileExtension: FileExtension;
    absoluteModulePath: string;
    glob?: unknown;
};
export type IdentifiedFileContent = {
    fileContent: UiContent;
    modulePath: string;
    moduleType: ModuleType;
};
/**
 * @param modulePath The module path is used to define the absolute path to the file
 * @param glob
 * @returns
 */
export declare const globToUiContent: (modulePath: string, glob: Promise<unknown> | unknown) => Promise<Result<UiContent>>;
