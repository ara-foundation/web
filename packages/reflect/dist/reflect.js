import { ProjectMemory } from "./project-memory.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import { Rest, SDSService } from "@ara-web/sds";
import { reflectElementToObjectTree } from "./reflect-object-tree.js";
import { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";
const setupWithNodeJsExt = (reflectSetup) => {
    if (reflectSetup.extensions === undefined) {
        reflectSetup.extensions = [new NodejsReflectExtension()];
    }
    else {
        reflectSetup.extensions.unshift(new NodejsReflectExtension());
    }
    return reflectSetup;
};
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect extends SDSService {
    // Category => Path => ModuleMemory Instance
    _memory;
    _rest;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup) {
        super(setupWithNodeJsExt(reflectSetup), ["rest"]);
        this._memory = new ProjectMemory();
        this._memory.putMemoryOperations(...this._extensions);
        const _proxy = new RestReflectHookProxy();
        const rest = new Rest(this._memory, reflectElementToObjectTree, { proxies: [_proxy], packageLink: reflectSetup.packageLink });
        const proxified = rest.proxifyMe();
        if (proxified.isFailure) {
            throw proxified;
        }
        this._rest = proxified.getValue();
    }
    get nodeJsExt() {
        return this._extensions[0];
    }
    rest() {
        return this._rest;
    }
}
