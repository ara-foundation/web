import { Result } from "@ara-web/p-hintjens";
import type { ExtensionInterface } from "./extension-interface.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import { ReflectProxy } from "./ReflectProxy.js";
import type { ReflectInterface } from "./reflect-interface.js";
export type ReflectSetup = {
    proxies?: ReflectProxy[];
    extensions?: ExtensionInterface[];
};
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect extends ReflectProxy implements ReflectInterface {
    private _memory;
    private _extensions;
    private _pubMethods;
    get publicMethods(): string[];
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup?: ReflectSetup);
    get nodeJsExt(): NodejsReflectExtension;
    /**
     * Pre-reflection operation to reload all the modules.
     * Additionally, this operation adds all supported built-in identifiers provided by NodeJS.
     */
    private beforeGet;
    /**
     * Get the content by the module category
     * @param moduleCategory
     */
    get?: <T>(moduleCategory: string) => Promise<Result<T[]>>;
}
