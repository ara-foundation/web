import { RestfulExtensionOperator, Service, type RestfulSetup } from "@ara-web/sds";
import { BuiltinModuleManager } from "./builtin-module-manager.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
export interface RestfulReflect {
    rest?(): RestReflectHookProxy;
}
/**
 * Reflect is the main source to Reflect on the website itself.
 * It's restful, so depends on the RestfulExtensionOperator, instead ExtensionOperator.
 */
export declare class Reflect extends Service implements RestfulReflect {
    private _rest;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup?: Omit<RestfulSetup, "rootNodeTag" | "packageLink">);
    get nodeJsExt(): BuiltinModuleManager;
    rest?(): RestReflectHookProxy;
    get extensionOperator(): RestfulExtensionOperator;
}
