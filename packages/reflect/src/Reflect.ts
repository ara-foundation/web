import { ModuleLink, OkResult, Result } from "@ara-web/ts-enhancement";
import { ProjectMemory } from "./ProjectMemory.js";
import type { ExtensionInterface } from "./extension-interface.js";
import { NodejsReflectExtension } from "./reflect-nodejs-ext/index.js";
import { ReflectProxy } from "./ReflectProxy.js";
import type { ReflectInterface } from "./reflect-interface.js";

export type ReflectSetup = {
    proxies?: ReflectProxy[];
    extensions?: ExtensionInterface[];
}

const desc = "Ara Web Reflect";
const link = ModuleLink.newPackageURL("@ara-web", "reflect");

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect extends ReflectProxy implements ReflectInterface  {    
    // Category => Path => ModuleMemory Instance
    private _memory: ProjectMemory;
    private _extensions: ExtensionInterface[];
    private _pubMethods = ["get"];

    public get publicMethods(): string[] {
        return this._pubMethods;
    }

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup 
     */
    constructor(reflectSetup?: ReflectSetup) {
        super(desc, link);
        this._memory = new ProjectMemory();
        const exts = reflectSetup?.extensions === undefined ? [] : reflectSetup.extensions;

        this._extensions = [new NodejsReflectExtension(), ...exts];
        this._memory.putMemoryOperations(...this._extensions);

        // In case if it's proxified:
        if (reflectSetup?.proxies !== undefined) {
            this.postProxies(reflectSetup.proxies.reverse());
            this.hideByProxy(this);
        }
    }

    public get nodeJsExt(): NodejsReflectExtension {
        return this._extensions[0] as NodejsReflectExtension;
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
    private beforeGet = async (moduleCategory: string): Promise<OkResult> => {
        // This operation is called every time, when in fact it must be called once, if the modules were updated.
        // To do it, keep track of the Hash of each project update memory.
        // And the sum of all hashes.
        // If it changed, then update the extensions.
        for (const extension of this._extensions) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(moduleCategory, this._memory);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.moduleLink}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    //****************************************************************
    // 
    // REST
    //
    //****************************************************************

    /**
     * Get the content by the module category
     * @param moduleCategory 
     */
    public get? = async <T>(moduleCategory: string): Promise<Result<T[]>> => {
        const preparationResult = await this.beforeGet(moduleCategory);
        if (preparationResult.isFailure) {
            return Result.fail(
                `this.beforeGet(): ${preparationResult.errorTitle}`,
                preparationResult.errorDescription!
            )
        }

        const moduleMemories = this._memory.getModuleContents<T>(moduleCategory);
        return Result.ok(moduleMemories)
    }

    // /**
    //  * Returns a page by it's path
    //  */
    // getPageByUrl = async(url: string | undefined): Promise<Page|undefined> => {
    //     if (url === undefined) {
    //         return undefined;
    //     }
    //     if (url.length === 0) {
    //         return undefined;
    //     }
    //     if (url[url.length - 1] === "/") {
    //         url = url.substring(0, url.length - 1);
    //     }

    //     const pages = await this.getPages();

    //     if (pages.isFailure) {
    //         return undefined;
    //     }

    //     for (const page of pages.getValue()) {
    //         const pageUrl = fileNameToUrl(page.fileName);
    //         if (url === pageUrl) {
    //             return page;
    //         }
    //     }

    //     return undefined;
    // }

}