import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "./memory/index.js";
import type { ExtensionInterface } from "./extension-interface.js";
import { ReflectExtension } from "./reflect-nodejs-ext/ReflectExtension.js";
import type { ModuleLink } from "./ara-link/ReflectAraLink.js";
import type { CategorizedModules } from "./setup.js";

export type ReflectSetup = {
    extensions?: ExtensionInterface[],
}

export class ThroughCategorizer {
    public recordsGetter: (() => Record<string, unknown>)|undefined = undefined;
    public categorizer: ExtensionInterface|undefined = undefined;
}

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect {
    // Category => Path => ModuleMemory Instance
    private _memory: ProjectMemory;
    private _autoImportFunc?: (() => CategorizedModules)|ThroughCategorizer;
    private _extensions: ExtensionInterface[];

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param reflectSetup 
     */
    constructor(reflectSetup?: ReflectSetup) {
        this._memory = new ProjectMemory();

        const nodeJsExt = new ReflectExtension();

        this._extensions = [nodeJsExt];
        if (reflectSetup?.extensions) {
            for (let extension of reflectSetup.extensions) {
                this._extensions.push(extension);
            }
        }

        for (let extension of this._extensions) {
            this._memory.putModuleLinksBuilder(extension.getPossibleModuleLinks);
        }
    }

    public get nodeJsExt(): ExtensionInterface {
        return this._extensions[0];
    }

    //****************************************************************
    // 
    // Modules Imports from the Project and Setting up internal Reflect memory.
    //
    //****************************************************************

    private _fetchModules = (): CategorizedModules|undefined => {
        if (this._autoImportFunc === undefined) {
            return undefined
        }
        
        if (typeof this._autoImportFunc !== "function") {
            if (this._autoImportFunc.recordsGetter === undefined || 
                this._autoImportFunc.categorizer === undefined) {
                return undefined;
            }
            const records = this._autoImportFunc.recordsGetter();
            const categorizedModules = this._autoImportFunc.categorizer.getCategorizedModuleData(records);
            if (categorizedModules.isFailure) {
                return undefined;
            }
            return categorizedModules.getValue();
        }
        return this._autoImportFunc();
    }

    // /** Returns the extension that works specifically with the category */
    // private _getExtensionByModuleCategory = (moduleCategory: string): Result<ExtensionInterface> => {
    //     for (let name in this._extensions) {
    //         if (this._extensions[name].isSupportedModuleCategory(moduleCategory)) {
    //             return Result.ok(this._extensions[name]);
    //         }
    //     }

    //     return Result.errorCode404(['Reflect'], '_getExtensionByModuleCategory', `There is no extension that works with the '${moduleCategory}' module category`)
    // }

    // /**
    //  * Returns all module modules defined by the extensions
    //  */
    // private _getModuleCategories = (): string[] => {
    //     const moduleCategories: string[] = [];
    //     for (let name in this._extensions) {
    //         moduleCategories.push(...this._extensions[name].moduleCategories)
    //     }

    //     return moduleCategories;
    // }

    /**
     * Returns the module's memory using the extension to define how to store the module in the form of
     * JSON.
     * @param moduleCategory 
     * @param modulePath 
     * @param glob 
     */
    private _getNewModuleMemory = (moduleCategory: string, modulePath: string, glob: unknown): Result<ModuleMemory<any>> => {
        const extensions = this._extensions.filter((extension) => (extension.isSupportedModuleCategory(moduleCategory)))
        if (extensions.length === 0) {
            return Result.errorCode404(['Reflect'], '_getModuleMemory', `There is no extension that works with the '${moduleCategory}'`)
        }

        const moduleLink = extensions[0].getNewModuleLink(moduleCategory, modulePath);
        const moduleMemory = extensions[0].getNewModuleMemory(moduleLink.getValue(), glob);
        if (moduleMemory.isFailure) {
            return Result.fail(`extension('${extensions[0].label}').getModuleMemory('${moduleCategory}', '${modulePath}'): ${moduleMemory.errorTitle}`,
                moduleMemory.errorDescription!
            )
        }
        return Result.ok(moduleMemory.getValue());
    }

    /**
     * Put the glob files into the reflect memory.
     * The JSON representation of the module is defined by the extensions.
     * @param {CategorizedModules?} categorizedModules optional.
     */
    public postModules = (categorizedModules: CategorizedModules): Result<undefined> => {
        for (let moduleCategory in categorizedModules) {
            const categoryModules = categorizedModules[moduleCategory];

            const addedModules: ModuleLink[] = [];

            for (let modulePath in categoryModules) {
                const glob = categoryModules[modulePath].glob;
                const moduleMemory = this._getNewModuleMemory(moduleCategory, modulePath, glob);
                if (moduleMemory.isFailure) {
                    return Result.fail(`this._getModuleMemory(): ${moduleMemory.errorTitle}`,
                        moduleMemory.errorDescription!
                    )
                } else {
                    addedModules.push(this._memory.putModuleMemory(moduleMemory.getValue()));
                }
            }

            // Delete the orphans
            this._memory.cleanMemoryExcept(moduleCategory, addedModules);
        }

        return Result.ok();
    }

    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc 
     */
    public postAutoImporter = (importFunc?: (() => CategorizedModules)| ThroughCategorizer) => {
        this._autoImportFunc = importFunc;
    }

    /**
     * Pre-reflection operation to reload all the modules.
     * Additionally, this operation adds all supported built-in identifiers provided by NodeJS.
     */
    private beforeGet = async (moduleCategory: string): Promise<OkResult> => {
        const categorizedModules = this._fetchModules();
        if (categorizedModules !== undefined) {
            const globsIdentified = this.postModules(categorizedModules);
            if (globsIdentified.isFailure) {
                return Result.fail(
                    `this.postModules(): ${globsIdentified.errorTitle}`,
                    globsIdentified.errorDescription!
                )
            }
        }

        // This operation is called every time, when in fact it must be called once, if the modules were updated.
        // To do it, keep track of the Hash of each project update memory.
        // And the sum of all hashes.
        // If it changed, then update the extensions.
        for (const extension of this._extensions) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(moduleCategory, this._memory);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.label}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
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
    public get = async <T>(moduleCategory: string): Promise<Result<T[]>> => {
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