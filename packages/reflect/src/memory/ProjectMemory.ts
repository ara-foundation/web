// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index

import { Debug, OkResult, Result } from "@ara-web/ts-enhancement";
// import { trimPath, urlToFileNames } from "../module.js";
import { ModuleMemory } from "./ModuleMemory.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../extension-interface.js";

export type ModuleMemories<T> = {[key: ModuleURL]: ModuleMemory<T|unknown>};

//  purl -> memory of Ceo.tsx
export class ProjectMemory {
    private _memories: ModuleMemories<unknown> = {};
    private _moduleLinksBuilders: PossibleModuleLinksBuilder[] = [];

    public get memories(): ModuleMemories<unknown> {
        return this._memories;
    }

    public putModuleLinksBuilder(moduleLinksBuilder: PossibleModuleLinksBuilder): void {
        this._moduleLinksBuilders.push(moduleLinksBuilder)
    }

    public putModuleMemory(moduleMemory: ModuleMemory<unknown>): ModuleLink {
        this._memories[moduleMemory.moduleLink.moduleURL] = moduleMemory;
        return moduleMemory.moduleLink;
    }

    public putModuleMemories(memories: ModuleMemories<unknown>): void {
        for (let moduleURL in memories) {
            this.putModuleMemory(memories[moduleURL as ModuleURL]);
        }
    }

    /**
     * Cleans the memory that belong to the moduleType category, if the memory module path is
     * not in the given list.
     * @param moduleType 
     * @param modulePaths 
     * @returns 
     */
    public cleanMemoryExcept(moduleCategory: string, moduleLinks: ModuleLink[]): void {
        // Delete the orphans
        let deletedModulePaths = Object.keys(
            this._memories
        )
        .filter((moduleURL) => (this._memories[moduleURL as ModuleURL].moduleLink.category === moduleCategory))
        .filter((modulePath) => (!moduleLinks.map((link) => (!link.isEqual(modulePath as ModuleURL)))))
        for (let orphan of deletedModulePaths) {
            delete this._memories[orphan as ModuleURL]
        }
    }

    private getPossibleModuleLinks(modulePath: string): ModuleLink[] {
        let moduleLinks: ModuleLink[] = [];
        for (let moduleLinksBuilder of this._moduleLinksBuilders) {
            moduleLinks = [...moduleLinks, ...moduleLinksBuilder(modulePath)];
        }

        return moduleLinks;
    }

    /**
     * Returns all module memories of the moduleType category.
     * @param moduleType 
     * @returns 
     */
    public getModuleMemories<T>(moduleCategory?: string): ModuleMemories<T|unknown> {
        if (moduleCategory === undefined) {
            return this._memories;
        }
        let modules: ModuleMemories<unknown> = {}
        for (const moduleURL in this._memories) {
            if (moduleCategory === undefined ||
                this._memories[moduleURL as ModuleURL].moduleLink.category === moduleCategory) {
                modules[moduleURL as ModuleURL] = this._memories[moduleURL as ModuleURL]
            }
        }

        return modules;
    }

    /**
     * Returns the modules that doesn't have contents
     * @param moduleCategory 
     */
    public getNoContentModules<T>(filterCategory?: string): ModuleMemories<T|unknown> {
        let modules: ModuleMemories<unknown> = {}
        for (const modulePath in this._memories) {
            const moduleURL = modulePath as ModuleURL;
            if (this._memories[moduleURL].content !== undefined) {
                continue;
            }
            const moduleCategory = this._memories[moduleURL].moduleLink.category;
            if (filterCategory === undefined || moduleCategory === filterCategory) {
                modules[moduleURL] = this._memories[moduleURL]
            }
        }

        return modules;
    }

    /**
     * Returns all the contents
     * @param moduleCategory 
     * @returns 
     */
    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModuleMemories<T>(moduleCategory);
        if (moduleMemories === undefined || Object.keys(moduleMemories).length === 0) {
            return [];
        }

        return Object.values(moduleMemories).map((moduleMemory) => (moduleMemory.content as T))
    }

    /**
     * Converts the import clause into a valid module link within the project memory.
     * @param importClause the import clause to 
     * @returns 
     */
    public getPossibleModuleLink(importClause: string): Result<ModuleLink> {
        const moduleLinks = this.getPossibleModuleLinks(importClause)
        for (let moduleLink of moduleLinks) {
            const moduleMemory = this._memories[moduleLink.moduleURL];
            if (moduleMemory !== undefined) {
                return Result.ok(moduleLink);
            }
        }

        return Result.fail(
            `Possible URLs not found`,
            `The '${importClause}' not found with '${this._moduleLinksBuilders.length}' module links builder in the memory`
        );
    }

    public getModuleMemory<T>(moduleLink: ModuleLink|ModuleURL): Result<ModuleMemory<T>> {
        const moduleURL = moduleLink instanceof ModuleLink ? moduleLink.moduleURL : moduleLink;
        const moduleMemory = this._memories[moduleURL] as ModuleMemory<T>;
        if (moduleMemory !== undefined) {
            return Result.ok(moduleMemory);
        }

        return Result.errorCode404(['src', 'ProjectMemory'], 'getModuleMemory', `${moduleURL} not found in the memory`)
    }

    /**
     * Put Module Content puts if the module in the URL exists
     * @param moduleURL 
     * @param content 
     */
    public putModuleContent<T>(moduleURL: ModuleURL, content: T): OkResult {
        if (this._memories[moduleURL] === undefined) {
            return OkResult.fail(`Module '${moduleURL}' not found`, `Please pass correct URL or check that memory didn't leak`)
        }
        this._memories[moduleURL].content = content;
        return OkResult.ok();
    }

    // /**
    //  * Get the file content loaded from modulePath.
    //  * It first attempts to load the data from the internal file content cache.
    //  * If doesn't exist, then identifies the file content, then caches the file content
    //  * before sending the file content back to the user.
    //  * @param {string} modulePath the module's path within the Ara Web
    //  * @returns 
    //  */
    // getGlob = async(modulePath: string): Promise<Result<unknown>> => {
    //     Debug.log(`The file content cache doesn't have the '${modulePath}' file content, identify it`);
        
    //     const identifiedModule = this.identifyModuleByPath(modulePath);
    //     if (identifiedModule === undefined) {
    //         return Result.fail(
    //             `this.identifyModuleByPath(modulePath: '${modulePath}'): not found`,
    //             `The module path not found in the memory`
    //         )
    //     }
    //     if (identifiedModule.getValue().moduleType === ModuleCategory.Untracked) {
    //         return Result.fail(
    //             `identifyModuleType(modulePath='${modulePath}')`,
    //             `The module path is not tracked by Ara Web`
    //         )
    //     } else if (identifiedModule.getValue().moduleType === ModuleCategory.Script) {
    //         const script = await this.getScriptByPath(modulePath);
    //         if (script === undefined) {
    //             return Result.fail(
    //                 `moduleType=ModuleType.Script: getScriptByPath(modulePath='${modulePath}')`,
    //                 `The script is not defined in the scripts path, are you sure that file exists or has the valid file extension?`
    //             )
    //         }
    //         return Result.ok({modulePath, moduleType: identifiedModule.getValue().moduleType, fileContent: script})
    //     } else if (identifiedModule.getValue().moduleType === ModuleCategory.Layout) {
    //         Debug.log(`Module '${modulePath}' is layout, get the layout: Unsupported yet`)
    //         // const fileContent = await componentFileContent(modulePath, moduleType);
    //         // if (fileContent.isFailure) {
    //         //     return Result.fail(
    //         //         `getComponentByPath(modulePath: '${modulePath}', moduleType: '${moduleType}'): ${fileContent.errorTitle}`,
    //         //         fileContent.errorDescription!
    //         //     )
    //         // }

    //         // return Result.ok({modulePath, moduleType, fileContent: fileContent.getValue()})
    //     } else if (identifiedModule.getValue().moduleType === ModuleCategory.NodeJsModule) {
    //         const module = await EnabledNodejsModules.getNodejsModuleByPath(trimPath(modulePath));
    //         if (module === undefined) {
    //             return Result.fail(
    //                 `moduleType=ModuleType.NodeJsModule: getNodejsModuleByPath(modulePath: '${modulePath}')`,
    //                 `The module is not enabled, are you sure that file exists and has valid extension?`
    //             )
    //         } else {
    //             return Result.ok({modulePath, moduleType: identifiedModule.getValue().moduleType, fileContent: module})
    //         }
    //     }
        
    //     return Result.fail(
    //         'Unsupported module type',
    //         `Only Script modules are supported, not '${identifiedModule.getValue().moduleType}' modules`
    //     )
    // }

    // /**
    //  * Try to get the script by the path name
    //  * @param {string} path to import the script
    //  * @returns {UiContent|Undefined}
    //  */
    // private getScriptByPath = async (path: string): Promise<unknown> => {
    //     path = trimPath(path);
    //     const scripts = this._memories[ModuleCategory.Script];
    //     for (let scriptPath in scripts) {
    //         const script = scripts[scriptPath];
    //         if (scriptPath.indexOf(path + ".ts") > -1 || scriptPath.indexOf(path + "/index.ts") > -1) {
    //             return script.glob;
    //         }
    //     }

    //     return undefined;
    // }

    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey 
         * @param filterValue 
         */
    public print = (filteredModuleCategory?: string, filterKey?: string, filterValue?: any): void => {
        let categoryModules = this.getModuleMemories(filteredModuleCategory);

        Debug.push(`Project Memory:`)
        for (let moduleURL in categoryModules) {
            Debug.log(`The '${moduleURL}' module:`);
            categoryModules[moduleURL as ModuleURL].print(filterKey, filterValue)
        }
            
        Debug.pop();
    }
}
