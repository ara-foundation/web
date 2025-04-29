// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { Debug } from "@ara-web/ts-enhancement/debug";
import { Result } from "@ara-web/ts-enhancement/result";
import { ModuleMemory } from "./ModuleMemory.js";
import { ModuleLink } from "@ara-web/ts-enhancement/module-link";
//  purl -> memory of Ceo.tsx
/**
 * `ProjectMemory` links all the module memories between extensions.
 */
export class ProjectMemory {
    _memOps = [];
    _moduleLink;
    constructor() {
        const absPath = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL(`@ara-web`, `reflect`, absPath, 'memory/ProjectMemory');
    }
    get operatorId() {
        return this._moduleLink;
    }
    putMemoryOperations = (memOp) => {
        this._memOps.push(memOp);
    };
    getModule(moduleLink) {
        for (let memOp of this._memOps) {
            const module = memOp.getModule(moduleLink);
            if (module.isSuccess) {
                return module;
            }
        }
        return Result.fail(`Module ${moduleLink} not found in any of the memory operations`, `Are you sure that it exists?`);
    }
    getModules(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            const memOpModules = memOp.getModules(moduleCategory);
            modules = [...modules, ...memOpModules];
        }
        return modules;
    }
    isModuleExist(moduleLink) {
        for (let memOp of this._memOps) {
            const exist = memOp.isModuleExist(moduleLink);
            if (exist) {
                return true;
            }
        }
        return false;
    }
    // /**
    //  * Cleans the memory that belong to the moduleType category, if the memory module path is
    //  * not in the given list.
    //  * @param moduleType 
    //  * @param modulePaths 
    //  * @returns 
    //  */
    // public cleanMemoryExcept(moduleCategory: string, moduleLinks: ModuleLink[]): void {
    //     // Delete the orphans
    //     let deletedModulePaths = Object.keys(
    //         this._memories
    //     )
    //     .filter((moduleURL) => (this._memories[moduleURL as ModuleURL].moduleLink.category === moduleCategory))
    //     .filter((modulePath) => (!moduleLinks.map((link) => (!link.isEqual(modulePath as ModuleURL)))))
    //     for (let orphan of deletedModulePaths) {
    //         delete this._memories[orphan as ModuleURL]
    //     }
    // }
    // private getPossibleModuleLinks(modulePath: string): ModuleLink[] {
    //     let moduleLinks: ModuleLink[] = [];
    //     for (let moduleLinksBuilder of this._moduleLinksBuilders) {
    //         moduleLinks = [...moduleLinks, ...moduleLinksBuilder(modulePath)];
    //     }
    //     return moduleLinks;
    // }
    /**
     * Returns all module memories of the moduleType category.
     * @param moduleType
     * @returns
     */
    /**
     * Returns the modules that doesn't have contents
     * @param moduleCategory
     */
    getNoContentModules(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModules(moduleCategory)];
        }
        return modules;
    }
    /**
     * Returns all the contents
     * @param moduleCategory
     * @returns
     */
    getModuleContents(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModuleContents(moduleCategory)];
        }
        return modules;
    }
    // /**
    //  * Converts the import clause into a valid module link within the project memory.
    //  * @param importClause the import clause to 
    //  * @returns 
    //  */
    // public getPossibleModuleLink(importClause: string): Result<ModuleLink> {
    //     const moduleLinks = this.getPossibleModuleLinks(importClause)
    //     for (let moduleLink of moduleLinks) {
    //         const moduleMemory = this._memories[moduleLink.moduleURL];
    //         if (moduleMemory !== undefined) {
    //             return Result.ok(moduleLink);
    //         }
    //     }
    //     return Result.fail(
    //         `Possible URLs not found`,
    //         `The '${importClause}' not found with '${this._moduleLinksBuilders.length}' module links builder in the memory`
    //     );
    // }
    // public getModuleMemory<T>(moduleLink: ModuleLink|ModuleURL): Result<ModuleMemory<T>> {
    //     const moduleURL = moduleLink instanceof ModuleLink ? moduleLink.moduleURL : moduleLink;
    //     const moduleMemory = this._memories[moduleURL] as ModuleMemory<T>;
    //     if (moduleMemory !== undefined) {
    //         return Result.ok(moduleMemory);
    //     }
    //     return Result.errorCode404(['src', 'ProjectMemory'], 'getModuleMemory', `${moduleURL} not found in the memory`)
    // }
    // /**
    //  * Put Module Content puts if the module in the URL exists
    //  * @param moduleURL 
    //  * @param content 
    //  */
    // public putModuleContent<T>(moduleURL: ModuleURL, content: T): OkResult {
    //     if (this._memories[moduleURL] === undefined) {
    //         return OkResult.fail(`Module '${moduleURL}' not found`, `Please pass correct URL or check that memory didn't leak`)
    //     }
    //     this._memories[moduleURL].content = content;
    //     return OkResult.ok();
    // }
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
    print = (filteredModuleCategory, filterKey, filterValue) => {
        let categoryModules = this.getModules(filteredModuleCategory);
        Debug.push(`Project Memory:`);
        for (let module of categoryModules) {
            Debug.log(`The '${module.moduleLink}' module:`);
            module.print(filterKey, filterValue);
        }
        Debug.pop();
    };
}
