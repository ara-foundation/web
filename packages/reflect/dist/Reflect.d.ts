import { Result } from "@ara-web/p-hintjens";
import type { ExtensionInterface } from "./extension-interface.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import type { ReflectInterface } from "./reflect-interface.js";
import { SDSService, type SDSSetup } from "@ara-web/p-hintjens/sds";
export type ReflectSetup = SDSSetup<ExtensionInterface>;
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect extends SDSService<Reflect, ExtensionInterface> implements ReflectInterface {
    private _memory;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup: ReflectSetup);
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
    get?<T>(moduleCategory: string): Promise<Result<T[]>>;
}
