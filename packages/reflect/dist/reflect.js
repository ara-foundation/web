import { ExtensionOperator, ModuleLink, Rest, RestfulExtensionOperator, Service } from "@ara-web/sds";
import { BuiltinModuleManager } from "./builtin-module-manager.js";
import { MEMOP_TAG, reflectDataToObjectTree } from "./reflect-object-tree.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
import { ChiefModuleManager } from "./chief-module-manager.js";
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
    constructor(setup = {}) {
        super(withDefaults(setup), ["rest"]);
        const restHookProxy = new RestReflectHookProxy();
        const restSetup = {
            packageLink: restLink,
            proxies: [restHookProxy],
        };
        const rest = new Rest(reflectDataToObjectTree, restSetup);
        const proxified = rest.proxifyMe();
        if (proxified.isFailure) {
            throw proxified;
        }
        this._rest = proxified.getValue();
        // Override the SDS's built in extension operator by 
        // the Reflect's chief module manager which is restful module manager.
        this.operator = new ChiefModuleManager(this.operator);
        this._rest.dispatcher.addExtension(this.operator.restHandler);
    }
    get nodeJsExt() {
        return this.extensionOperator.extensions[0];
    }
    rest() {
        return this._rest;
    }
    get extensionOperator() {
        return this.operator;
    }
}
