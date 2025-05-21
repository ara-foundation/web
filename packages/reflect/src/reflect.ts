import { ProjectMemory } from "./project-memory.js";
import type { ExtensionInterface } from "./extension-interface.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import type { ReflectInterface } from "./reflect-interface.js";
import { Rest, SDSService, type SDSSetup } from "@ara-web/sds";
import { reflectElementToObjectTree, type ReflectElementType } from "./reflect-object-tree.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";

export type ReflectSetup = SDSSetup<ExtensionInterface>;

const setupWithNodeJsExt = (reflectSetup: ReflectSetup): ReflectSetup => {
    if (reflectSetup.extensions === undefined) {
        reflectSetup.extensions = [new NodejsReflectExtension()]
    } else {
        reflectSetup.extensions.unshift(new NodejsReflectExtension())
    }
    return reflectSetup;
}

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect extends SDSService<Reflect, ExtensionInterface> implements ReflectInterface  {    
    // Category => Path => ModuleMemory Instance
    private _memory: ProjectMemory;
    private _rest: RestReflectHookProxy;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup 
     */
    constructor(reflectSetup: ReflectSetup) {
        super(setupWithNodeJsExt(reflectSetup), ["get"]);
        this._memory = new ProjectMemory();
        this._memory.putMemoryOperations(...this._extensions);
        const _proxy = new RestReflectHookProxy();
        const rest = new Rest<ReflectElementType>(this._memory, reflectElementToObjectTree, {proxies: [_proxy], packageLink: reflectSetup.packageLink});
        const proxified = rest.proxifyMe<RestReflectHookProxy>();
        if (proxified.isFailure) {
            throw proxified;
        }
        this._rest = proxified.getValue();
    }

    public get nodeJsExt(): NodejsReflectExtension {
        return this._extensions[0] as NodejsReflectExtension;
    }

    public get rest(): RestReflectHookProxy {
        return this._rest;
    }
}