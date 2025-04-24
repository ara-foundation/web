// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { Debug, Result } from "@ara-web/ts-enhancement";
import { ModuleType, trimPath, urlToFileNames } from "../module.js";
import { ModuleMemory } from "./ModuleMemory.js";
import { EnabledNodejsModules } from "../enabled-nodejs-module.js";
//  Component -> Ceo.tsx -> memory of Ceo.tsx
export class ProjectMemory {
    _memories = {};
    get memories() {
        return this._memories;
    }
    putModuleMemory(moduleType, modulePath, moduleMemory) {
        if (this._memories[moduleType] === undefined) {
            this._memories[moduleType] = {};
        }
        this._memories[moduleType][modulePath] = moduleMemory;
    }
    putModuleMemories(moduleType, memories) {
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
    cleanMemoryExcept(moduleType, modulePaths) {
        if (this._memories[moduleType] === undefined) {
            return;
        }
        // Delete the orphans
        let deletedModulePaths = Object.keys(this._memories[moduleType]).filter((modulePath) => (!modulePaths.includes(modulePath)));
        for (let orphan of deletedModulePaths) {
            delete this._memories[moduleType][orphan];
        }
    }
    /**
     * Returns all module memories of the moduleType type.
     * @param moduleType
     * @returns
     */
    getModuleMemories(moduleType) {
        const modules = this._memories[moduleType];
        if (modules === undefined) {
            return undefined;
        }
        return modules;
    }
    getModuleMemory(moduleType, modulePath) {
        const modules = this._memories[moduleType];
        if (modules === undefined) {
            return undefined;
        }
        if (modules[modulePath] === undefined) {
            for (let memoizedPath in modules) {
                const trimmedPaths = urlToFileNames(trimPath(modulePath));
                for (let trimmedPath of trimmedPaths) {
                    if (memoizedPath.indexOf(trimmedPath) === 0) {
                        return modules[memoizedPath];
                    }
                }
            }
        }
        return modules[modulePath];
    }
    identifyModuleByPath(modulePath) {
        const moduleTypes = Object.keys(this._memories);
        for (let moduleType of moduleTypes) {
            // Debug.push(`this.getModuleMemory()`, {moduleType, modulePath})
            const moduleMemory = this.getModuleMemory(moduleType, modulePath);
            // Debug.pop()
            // Debug.log(`The module '${modulePath}' of '${moduleType}' type identified? ${moduleMemory !== undefined}`);
            if (moduleMemory !== undefined) {
                return Result.ok({ moduleMemory, moduleType: moduleType, modulePath });
            }
        }
        return Result.fail(`'${modulePath}' module path not found`, `The given module path is not in the memory`);
    }
    putModuleContent(moduleType, modulePath, content) {
        this._memories[moduleType][modulePath].content = content;
    }
    /**
     * Get the file content loaded from modulePath.
     * It first attempts to load the data from the internal file content cache.
     * If doesn't exist, then identifies the file content, then caches the file content
     * before sending the file content back to the user.
     * @param {string} modulePath the module's path within the Ara Web
     * @returns
     */
    getGlob = async (modulePath) => {
        Debug.log(`The file content cache doesn't have the '${modulePath}' file content, identify it`);
        const identifiedModule = this.identifyModuleByPath(modulePath);
        if (identifiedModule === undefined) {
            return Result.fail(`this.identifyModuleByPath(modulePath: '${modulePath}'): not found`, `The module path not found in the memory`);
        }
        if (identifiedModule.getValue().moduleType === ModuleType.Untracked) {
            return Result.fail(`identifyModuleType(modulePath='${modulePath}')`, `The module path is not tracked by Ara Web`);
        }
        else if (identifiedModule.getValue().moduleType === ModuleType.Script) {
            const script = await this.getScriptByPath(modulePath);
            if (script === undefined) {
                return Result.fail(`moduleType=ModuleType.Script: getScriptByPath(modulePath='${modulePath}')`, `The script is not defined in the scripts path, are you sure that file exists or has the valid file extension?`);
            }
            return Result.ok({ modulePath, moduleType: identifiedModule.getValue().moduleType, fileContent: script });
        }
        else if (identifiedModule.getValue().moduleType === ModuleType.Layout) {
            Debug.log(`Module '${modulePath}' is layout, get the layout: Unsupported yet`);
            // const fileContent = await componentFileContent(modulePath, moduleType);
            // if (fileContent.isFailure) {
            //     return Result.fail(
            //         `getComponentByPath(modulePath: '${modulePath}', moduleType: '${moduleType}'): ${fileContent.errorTitle}`,
            //         fileContent.errorDescription!
            //     )
            // }
            // return Result.ok({modulePath, moduleType, fileContent: fileContent.getValue()})
        }
        else if (identifiedModule.getValue().moduleType === ModuleType.NodeJsModule) {
            const module = await EnabledNodejsModules.getNodejsModuleByPath(trimPath(modulePath));
            if (module === undefined) {
                return Result.fail(`moduleType=ModuleType.NodeJsModule: getNodejsModuleByPath(modulePath: '${modulePath}')`, `The module is not enabled, are you sure that file exists and has valid extension?`);
            }
            else {
                return Result.ok({ modulePath, moduleType: identifiedModule.getValue().moduleType, fileContent: module });
            }
        }
        return Result.fail('Unsupported module type', `Only Script modules are supported, not '${identifiedModule.getValue().moduleType}' modules`);
    };
    /**
     * Try to get the script by the path name
     * @param {string} path to import the script
     * @returns {UiContent|Undefined}
     */
    getScriptByPath = async (path) => {
        path = trimPath(path);
        const scripts = this._memories[ModuleType.Script];
        for (let scriptPath in scripts) {
            const script = scripts[scriptPath];
            if (scriptPath.indexOf(path + ".ts") > -1 || scriptPath.indexOf(path + "/index.ts") > -1) {
                return script.glob;
            }
        }
        return undefined;
    };
    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey
         * @param filterValue
         */
    print = (moduleType, filterKey, filterValue) => {
        Debug.push(`Memory Dump`);
        for (let moduleCategory in this._memories) {
            let categoryModules;
            if (moduleType !== undefined) {
                categoryModules = this._memories[moduleType];
                Debug.log(`The '${moduleType}' modules:`);
            }
            else {
                categoryModules = this._memories[moduleCategory];
                Debug.log(`The '${moduleCategory}' modules:`);
            }
            for (let modulePath in categoryModules) {
                Debug.log(`The '${modulePath}' module:`);
                categoryModules[modulePath].print(filterKey, filterValue);
            }
            if (moduleType !== undefined) {
                break;
            }
        }
        Debug.pop();
    };
}
