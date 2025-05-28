import { 
    ExtensionOperator, 
    ModuleLink, 
    Rest, 
    RestfulExtensionOperator, 
    Service, 
    type RestfulSetup, 
    type Setup 
} from "@ara-web/sds";
import { BuiltinModuleManager } from "./builtin-module-manager.js";
import { 
    MEMOP_TAG,
    reflectDataToObjectTree, 
    type ReflectDataType
} from "./reflect-object-tree.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
import { ChiefModuleManager } from "./chief-module-manager.js";

export interface RestfulReflect {
    rest?(): RestReflectHookProxy;
}

const reflectPkgLink = ModuleLink.newPackageLink('@ara-web', 'reflect');
const restLink = ModuleLink.newPackageLink('@ara-web', 'reflect', 'rest-engine');

const withDefaults = (reflectSetup: Omit<RestfulSetup, "rootNodeTag" | "packageLink">): RestfulSetup => {
    if (reflectSetup.extensions === undefined) {
        reflectSetup.extensions = [new BuiltinModuleManager()]
    } else {
        reflectSetup.extensions.unshift(new BuiltinModuleManager())
    }
    return {...reflectSetup, rootNodeTag: MEMOP_TAG, packageLink: reflectPkgLink};
}

/**
 * Reflect is the main source to Reflect on the website itself.
 * It's restful, so depends on the RestfulExtensionOperator, instead ExtensionOperator.
 */
export class Reflect extends Service implements RestfulReflect  {    
    // Category => Path => ModuleMemory Instance
    private _rest: RestReflectHookProxy;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: Omit<RestfulSetup, "rootNodeTag" | "packageLink"> = {}) {
        super(withDefaults(setup), ["rest"]);
        this.operator = new ChiefModuleManager(this.operator as ExtensionOperator);
        const restHookProxy = new RestReflectHookProxy();
        const restSetup: Setup = {
            packageLink: restLink,
            proxies: [restHookProxy], 
            extensions: [(this.operator as RestfulExtensionOperator).restDispatcher],
        }
        const rest = new Rest<ReflectDataType>(this.extensionOperator, reflectDataToObjectTree, restSetup);
        const proxified = rest.proxifyMe<RestReflectHookProxy>();
        if (proxified.isFailure) {
            throw proxified;
        }
        this._rest = proxified.getValue();
        const restfulLinked = (this.operator as ChiefModuleManager).setRestDispatcherOperator(rest);
        if (restfulLinked.isFailure) {
            throw restfulLinked;
        }
        this.nodeJsExt.setRestSyncer(this._rest.rootNode!, reflectDataToObjectTree);

    }

    public get nodeJsExt(): BuiltinModuleManager {
        return this.extensionOperator.exts[0] as BuiltinModuleManager;
    }

    public rest?(): RestReflectHookProxy {
        return this._rest;
    }

    public get extensionOperator(): RestfulExtensionOperator {
        return this.operator as RestfulExtensionOperator;
    }
}