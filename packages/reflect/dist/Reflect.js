import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ProjectMemory } from "./ProjectMemory.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect {
    // Category => Path => ModuleMemory Instance
    _memory;
    _extensions;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup
     */
    constructor(reflectSetup) {
        this._memory = new ProjectMemory();
        const nodeJsExt = new NodejsReflectExtension();
        this._extensions = [nodeJsExt];
        if (reflectSetup?.extensions) {
            for (let extension of reflectSetup.extensions) {
                this._extensions.push(extension);
            }
        }
        for (let extension of this._extensions) {
            this._memory.putMemoryOperations(extension);
        }
    }
    get nodeJsExt() {
        return this._extensions[0];
    }
    //****************************************************************
    // 
    // Modules Imports from the Project and Setting up internal Reflect memory.
    //
    //****************************************************************
    /**
     * Pre-reflection operation to reload all the modules.
     * Additionally, this operation adds all supported built-in identifiers provided by NodeJS.
     */
    beforeGet = async (moduleCategory) => {
        // This operation is called every time, when in fact it must be called once, if the modules were updated.
        // To do it, keep track of the Hash of each project update memory.
        // And the sum of all hashes.
        // If it changed, then update the extensions.
        for (const extension of this._extensions) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(moduleCategory, this._memory);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.moduleLink}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    //****************************************************************
    // 
    // REST
    //
    //****************************************************************
    /**
     * Get the content by the module category
     * @param moduleCategory
     */
    get = async (moduleCategory) => {
        const preparationResult = await this.beforeGet(moduleCategory);
        if (preparationResult.isFailure) {
            return Result.fail(`this.beforeGet(): ${preparationResult.errorTitle}`, preparationResult.errorDescription);
        }
        const moduleMemories = this._memory.getModuleContents(moduleCategory);
        return Result.ok(moduleMemories);
    };
}
