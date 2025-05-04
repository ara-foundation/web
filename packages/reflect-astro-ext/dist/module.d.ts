import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import { FileExtension, type Component, type ModuleParts } from "./ontology/index.js";
import type { ProjectMemory } from "@ara-web/reflect";
/**
 * Module Category to sort the modules.
 * By design module categories supposed to match the directory in the file system.
 * Although it's not required.
 */
export declare enum ModuleCategory {
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts"
}
/**
 * Detects the module category. To detct, it must be in the src.
 * @param modulePath
 * @returns
 */
export declare const extractModuleCategory: (srcDir: string, modulePath: string) => Result<ModuleCategory | string>;
/**
 * Partition the Module into the UI elements and the source code
 */
export declare class ModulePartitioner {
    private constructor();
    /**
     * Identifies the parts that the module has. Additionally, it also identifies the source code
     * @returns {Result<ModuleParts>}
     */
    static partition: <T>(moduleMemory: ModuleMemory<T>) => Promise<Result<ModuleParts>>;
    /**
     * Returns a page by it's path
     */
    getPageByUrl: (url: string | undefined) => Promise<Component | undefined>;
    /**
     * Loads the module and returns the module parts such as which HTML elements it contains and source code.
     *
     * @param modulePath The module path is used to define the absolute path to the file
     * @param glob
     * @returns
     */
    private static getModuleParts;
    /**
     * Sets the code and nodes properties of the file content if it's an Astro file
     * @param astroSource through the file system we read the content of the file
     * @returns {Promise<ModuleParts>} fileContent with the `nodes` and `code` properties set
     */
    private static parseAstroFile;
    /**
     * Parses the Astro web page into the components and its frontmatter code.
     *
     * Supports:
     *  - Component
     *  - Element types.
     * The pure text components in the web pages are not considered.
     * @param ast A RootNode of the Astro Web Page
     * @returns Components and Frontmatter
     */
    private static extractAstroComponents;
}
/**
 * If Module is Script or Asset, basically anything that is not UI Level, but also
 * doesn't require identifying code structure, therefore not in Code Level too.
 *
 * Ontologically, `ModuleIdentifier` supports translation of modules into `Script` and `Asset` data
 */
export declare class ModuleIdentifier {
    /**
     * Checks is the following a script, which are the files that ends with TS and JS.
     * @param fileExtension
     */
    static isScript: (fileExtension: FileExtension) => boolean;
    static isAsset: (fileExtension: FileExtension) => boolean;
    /**
     * Converts the module `parts` and module `rawMemory` into `Script` or `Asset`.
     * Detects the identification by the module link.
     * @param parts
     * @param rawMemory
     * @returns
     */
    static identify: <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>, _: ProjectMemory) => Promise<Result<T>>;
}
