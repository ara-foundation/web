import { Result } from "@ara-web/ts-enhancement/result";
import type { ExtensionInterface } from "./extension-interface.js";
export type ReflectSetup = {
    extensions?: ExtensionInterface[];
};
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect {
    private _memory;
    private _extensions;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup?: ReflectSetup);
    get nodeJsExt(): ExtensionInterface;
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
