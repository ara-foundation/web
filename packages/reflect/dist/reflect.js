import { ExtensionOperator, ModuleLink, Rest, RestfulExtensionOperator, Service } from "@ara-web/sds";
import { BuiltinModuleManager } from "./builtin-module-manager.js";
import { MEMOP_TAG, reflectDataToObjectTree } from "./reflect-object-tree.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
import { ModuleMemoryOperator } from "./module-manager-operator.js";
const reflectPkgLink = ModuleLink.newPackageLink('@ara-web', 'reflect');
const restLink = ModuleLink.newPackageLink('@ara-web', 'reflect', 'rest-engine');
const withDefaults = (reflectSetup) => {
    if (reflectSetup.extensions === undefined) {
        reflectSetup.extensions = [new BuiltinModuleManager()];
    }
    else {
        reflectSetup.extensions.unshift(new BuiltinModuleManager());
    }
    return { ...reflectSetup, rootNodeTag: MEMOP_TAG, packageLink: reflectPkgLink };
};
/**
 * Reflect is the main source to Reflect on the website itself.
 * It's restful, so depends on the RestfulExtensionOperator, instead ExtensionOperator.
 */
export class Reflect extends Service {
    // Category => Path => ModuleMemory Instance
    _rest;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup) {
        super(withDefaults(setup), ["rest"]);
        this.operator = new ModuleMemoryOperator(this.operator);
        const restHookProxy = new RestReflectHookProxy();
        const restSetup = {
            packageLink: restLink,
            proxies: [restHookProxy],
            extensions: [this.operator.restDispatcher],
        };
        const rest = new Rest(this.extensionOperator, reflectDataToObjectTree, restSetup);
        const proxified = rest.proxifyMe();
        if (proxified.isFailure) {
            throw proxified;
        }
        this._rest = proxified.getValue();
    }
    get nodeJsExt() {
        return this.extensionOperator.exts[0];
    }
    rest() {
        return this._rest;
    }
    get extensionOperator() {
        return this.operator;
    }
}
