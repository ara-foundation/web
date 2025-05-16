import { ModuleLink, type ModuleURL } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "./module-memory.js";
import type { MemoryOperations } from "./extension-interface.js";
export type ModuleMemories<T> = {
    [key: ModuleURL]: ModuleMemory<T | unknown>;
};
/**
 * `ProjectMemory` links all the module memories between extensions.
 */
export declare class ProjectMemory implements MemoryOperations {
    private _memOps;
    private _moduleLink;
    constructor();
    /**
     * Return the module file paths from the link
     * @param moduleLink
     * @returns
     */
    getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[];
    /**
     * My ID;
     */
    get memoryOperatorId(): ModuleLink;
    /**
     * Register extensions
     * @param memOp
     */
    putMemoryOperations: (...memOp: MemoryOperations[]) => void;
    /**
     * Return the module memory by the module link.
     * @param moduleLink
     * @returns
     */
    getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>>;
    getModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    /**
     * Returns all module memories of the moduleType category.
     * @param moduleType
     * @returns
     */
    /**
     * Returns the modules that doesn't have contents
     * @param moduleCategory
     */
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    /**
     * Returns all the contents
     * @param moduleCategory
     * @returns
     */
    getModuleContents<T>(moduleCategory?: string): T[];
    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey
         * @param filterValue
         */
    print: (filteredModuleCategory?: string, filterKey?: string, filterValue?: any) => void;
}
