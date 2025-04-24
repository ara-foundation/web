import { Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleType } from "../module.js";
import { ModuleMemory } from "./ModuleMemory.js";
type SupportedModuleMemories = ModuleMemory<Component | Page | unknown>;
export type ModuleMemories = {
    [key in ModuleType]?: {
        [key: string]: SupportedModuleMemories;
    };
};
export type IdentifiedModuleMemory<T> = {
    moduleMemory: ModuleMemory<T>;
    modulePath: string;
    moduleType: ModuleType;
};
export declare class ProjectMemory {
    private _memories;
    get memories(): ModuleMemories;
    putModuleMemory(moduleType: ModuleType, modulePath: string, moduleMemory: SupportedModuleMemories): void;
    putModuleMemories(moduleType: ModuleType, memories: {
        [key: string]: SupportedModuleMemories;
    }): void;
    /**
     * Cleans the memory that belong to the moduleType category, if the memory module path is
     * not in the given list.
     * @param moduleType
     * @param modulePaths
     * @returns
     */
    cleanMemoryExcept(moduleType: ModuleType, modulePaths: string[]): void;
    /**
     * Returns all module memories of the moduleType type.
     * @param moduleType
     * @returns
     */
    getModuleMemories<T>(moduleType: ModuleType): {
        [key: string]: ModuleMemory<T>;
    } | undefined;
    getModuleMemory<T>(moduleType: ModuleType, modulePath: string): ModuleMemory<T> | undefined;
    identifyModuleByPath<T>(modulePath: string): Result<IdentifiedModuleMemory<T>>;
    putModuleContent<T>(moduleType: ModuleType, modulePath: string, content: T): void;
    /**
     * Get the file content loaded from modulePath.
     * It first attempts to load the data from the internal file content cache.
     * If doesn't exist, then identifies the file content, then caches the file content
     * before sending the file content back to the user.
     * @param {string} modulePath the module's path within the Ara Web
     * @returns
     */
    getGlob: (modulePath: string) => Promise<Result<unknown>>;
    /**
     * Try to get the script by the path name
     * @param {string} path to import the script
     * @returns {UiContent|Undefined}
     */
    private getScriptByPath;
    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey
         * @param filterValue
         */
    print: (moduleType?: ModuleType, filterKey?: string, filterValue?: any) => void;
}
export {};
