import type { ExtensionInterface } from "./extension-interface.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import type { ReflectInterface } from "./reflect-interface.js";
import { SDSService, type SDSSetup } from "@ara-web/sds";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
export type ReflectSetup = SDSSetup<ExtensionInterface>;
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class Reflect extends SDSService<Reflect, ExtensionInterface> implements ReflectInterface {
    private _memory;
    private _rest;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup: ReflectSetup);
    get nodeJsExt(): NodejsReflectExtension;
    rest?(): RestReflectHookProxy;
}
