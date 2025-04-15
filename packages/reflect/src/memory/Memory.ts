// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index

import { Debug, Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleType, trimPath, urlToFileName } from "../module.js";
import { ModuleMemory } from "./ModuleMemory.js";
import { getScriptByPath } from "../script.js";

type SupportedModuleMemories = ModuleMemory<Component|Page|unknown>;
export type ModuleMemories = {[key in ModuleType]?: {[key: string]: SupportedModuleMemories}};

export type IdentifiedModuleMemory<T> = {
    moduleMemory: ModuleMemory<T>,
    modulePath: string,
    moduleType: ModuleType,
}

//  Component -> Ceo.tsx -> memory of Ceo.tsx
export class Memory {
    private _memories: ModuleMemories = {};

    public get memories(): ModuleMemories {
        return this._memories;
    }

    public putModuleMemory(moduleType: ModuleType, modulePath: string, moduleMemory: SupportedModuleMemories): void {
        if (this._memories[moduleType] === undefined) {
            this._memories[moduleType] = {};
        }

        this._memories[moduleType][modulePath] = moduleMemory;
    }

    public putModuleMemories(moduleType: ModuleType, memories: {[key: string]: SupportedModuleMemories}): void {
        for (let modulePath in memories) {
            this.putModuleMemory(moduleType, modulePath, memories[modulePath]);
        }
    }

    /**
     * Cleans the memory that belong to the moduleType category, if the memory module path is
     * not in the given list.
     * @param moduleType 
     * @param modulePaths 
     * @returns 
     */
    public cleanMemoryExcept(moduleType: ModuleType, modulePaths: string[]): void {
        if (this._memories[moduleType] === undefined) {
            return;
        }
        // Delete the orphans
        let deletedModulePaths = Object.keys(this._memories[moduleType]).filter((modulePath) => (!modulePaths.includes(modulePath)))

        for (let orphan of deletedModulePaths) {
            delete this._memories[moduleType][orphan]
        }
    }

    /**
     * Returns all module memories of the moduleType type.
     * @param moduleType 
     * @returns 
     */
    public getModuleMemories<T>(moduleType: ModuleType): {[key: string]: ModuleMemory<T>}|undefined {
        const modules = this._memories[moduleType];
        if (modules === undefined) {
            return undefined;
        }
        return modules as {[key: string]: ModuleMemory<T>};
    }

    public getModuleMemory<T>(moduleType: ModuleType, modulePath: string): ModuleMemory<T>|undefined {
        const modules = this._memories[moduleType];
        if (modules === undefined) {
            return undefined;
        }
        if (modules[modulePath] === undefined) {
            for (let memoizedPath in modules) {
                const trimmedPath = urlToFileName(trimPath(modulePath));
                if (memoizedPath.indexOf(trimmedPath) === 0) {
                    return modules[memoizedPath] as ModuleMemory<T>;
                }
            }
        }
        return modules[modulePath] as ModuleMemory<T>;
    }

    public identifyModuleByPath<T>(modulePath: string): Result<IdentifiedModuleMemory<T>> {
        const moduleTypes = Object.keys(this._memories);
        for (let moduleType of moduleTypes) {
            // Debug.push(`this.getModuleMemory()`, {moduleType, modulePath})
            const moduleMemory = this.getModuleMemory<T>(moduleType as ModuleType, modulePath);
            // Debug.pop()
            // Debug.log(`The module '${modulePath}' of '${moduleType}' type identified? ${moduleMemory !== undefined}`);
            if (moduleMemory !== undefined) {
                return Result.ok({moduleMemory, moduleType: moduleType as ModuleType, modulePath});
            }
        }

        return Result.fail(
            `'${modulePath}' module path not found`,
            `The given module path is not in the memory`
        );
    }

    public putModuleContent<T>(moduleType: ModuleType, modulePath: string, content: T) {
        this._memories[moduleType]![modulePath].content = content;
    }

    /**
     * Get the file content loaded from modulePath.
     * It first attempts to load the data from the internal file content cache.
     * If doesn't exist, then identifies the file content, then caches the file content
     * before sending the file content back to the user.
     * @param {string} modulePath the module's path within the Ara Web
     * @returns 
     */
    getGlob = async(modulePath: string): Promise<Result<unknown>> => {
        Debug.log(`The file content cache doesn't have the '${modulePath}' file content, identify it`);
        
        const identifiedModule = this.identifyModuleByPath(modulePath);
        if (identifiedModule === undefined) {
            return Result.fail(
                `this.identifyModuleByPath(modulePath: '${modulePath}'): not found`,
                `The module path not found in the memory`
            )
        }
        if (identifiedModule.moduleType === ModuleType.Untracked) {
            return Result.fail(
                `identifyModuleType(modulePath='${modulePath}')`,
                `The module path is not tracked by Ara Web`
            )
        } else if (identifiedModule.moduleType === ModuleType.Script) {
            const script = await getScriptByPath(modulePath);
            if (script === undefined) {
                return Result.fail(
                    `moduleType=ModuleType.Script: getScriptByPath(modulePath='${modulePath}')`,
                    `The script is not defined in the scripts path, are you sure that file exists or has the valid file extension?`
                )
            }
            return Result.ok({modulePath, moduleType, fileContent: script})
        } else if (identifiedModule.moduleType === ModuleType.Layout) {
            Debug.log(`Module '${modulePath}' is layout, get the layout: Unsupported yet`)
            // const fileContent = await componentFileContent(modulePath, moduleType);
            // if (fileContent.isFailure) {
            //     return Result.fail(
            //         `getComponentByPath(modulePath: '${modulePath}', moduleType: '${moduleType}'): ${fileContent.errorTitle}`,
            //         fileContent.errorDescription!
            //     )
            // }

            // return Result.ok({modulePath, moduleType, fileContent: fileContent.getValue()})
        } else if (identifiedModule.moduleType === ModuleType.NodeJsModule) {
            const module = await getNodejsModuleByPath(trimPath(modulePath));
            if (module === undefined) {
                return Result.fail(
                    `moduleType=ModuleType.NodeJsModule: getNodejsModuleByPath(modulePath: '${modulePath}')`,
                    `The module is not enabled, are you sure that file exists and has valid extension?`
                )
            } else {
                return Result.ok({modulePath, moduleType, fileContent: module})
            }
        }
        
        return Result.fail(
            'Unsupported module type',
            `Only Script modules are supported, not '${moduleType}' modules`
        )
    }

    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey 
         * @param filterValue 
         */
    public print = (moduleType?: ModuleType, filterKey?: string, filterValue?: any): void => {
            Debug.push(`Memory Dump`)
            for (let moduleCategory in this._memories) {
                let categoryModules: {
                    [key: string]: ModuleMemory<unknown>;
                } | undefined;
                if (moduleType !== undefined) {
                    categoryModules = this._memories[moduleType];
                    Debug.log(`The '${moduleType}' modules:`);
                } else {
                    categoryModules = this._memories[moduleCategory as ModuleType]
                    Debug.log(`The '${moduleCategory}' modules:`);
                }
    
                for (let modulePath in categoryModules) {
                    Debug.log(`The '${modulePath}' module:`);
                    categoryModules[modulePath].print(filterKey, filterValue)
                }
    
                if (moduleType !== undefined) {
                    break;
                }
            }
            
            Debug.pop();
    }
}
