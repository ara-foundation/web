import { Result } from "@ara-web/ts-enhancement";
import type { ExtensionInterface } from "./extension-interface.js";
export type ModuleData = {
    [key: string]: {
        glob: unknown;
    };
};
export type CategorizedModules = {
    [key: string]: ModuleData;
};
export type ReflectSetup = {
    extensions?: ExtensionInterface[];
};
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect {
    private _memory;
    private _autoImportFunc?;
    private _extensions;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup?: ReflectSetup);
    private _fetchModules;
    /**
     * Returns the module's memory using the extension to define how to store the module in the form of
     * JSON.
     * @param moduleCategory
     * @param modulePath
     * @param glob
     */
    private _getNewModuleMemory;
    /**
     * Put the glob files into the reflect memory.
     * The JSON representation of the module is defined by the extensions.
     * @param {CategorizedModules?} categorizedModules optional.
     */
    postModules: (categorizedModules: CategorizedModules) => Result<undefined>;
    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc
     */
    postAutoImporter: (importFunc?: (() => CategorizedModules)) => void;
    /**
     * Pre-reflection operation to reload all the modules.
     * Additionally, this operation adds all supported built-in identifiers provided by NodeJS.
     */
    private beforeGet;
    /**
     * Get the content by the module category
     * @param moduleCategory
     */
    get: <T>(moduleCategory: string) => Promise<Result<T[]>>;
}
