import { Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleType } from "./module.js";
export type ModuleGlobs = {
    [key: string]: {
        glob: unknown;
    };
};
export type CategorizedModuleGlobs = {
    [key in ModuleType]?: ModuleGlobs;
};
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect {
    private _memory;
    private _autoImportFunc?;
    constructor();
    /**
     * Put the glob files into the reflect memory.
     * If the moduleGlobs are not given, then it will dynamically load the
     * globs when other public function are inserted.
     * @param {CategorizedModuleGlobs?} moduleGlobs optional.
     * @notice To enable auto import, simply call the this.putAutoGlobImport(funcReference)
     */
    putGlobs: (moduleGlobs?: CategorizedModuleGlobs) => Result<undefined>;
    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc
     */
    putAutoGlobImporter: (importFunc?: (() => CategorizedModuleGlobs)) => void;
    private _pre;
    /**
     * Returns the all the components.
     * Components are not evaluated by internal structures.
     */
    getComponents: () => Promise<Result<Component[]>>;
    /**
     * Returns the all the layout components
     */
    getLayouts: () => Promise<Result<Component[]>>;
    /**
     * Returns all the pages
     * @returns {Result<Page[]>}
     */
    getPages: () => Promise<Result<Page[]>>;
    /**
     * Returns a page by it's path
     */
    getPageByUrl: (url: string | undefined) => Promise<Page | undefined>;
    private getPageTraits;
    private postBuiltInIdentifiers;
    private identifyImports;
    private lintTypes;
    private lintImports;
    private identifyTypes;
}
