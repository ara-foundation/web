import { Result } from "@ara-web/ts-enhancement";
import { ModuleMemory } from "./ModuleMemory.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ModuleLink.js";
import type { MemoryOperations } from "../extension-interface.js";
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
    get operatorId(): ModuleLink;
    putMemoryOperations: (memOp: MemoryOperations) => void;
    getModule<T>(moduleLink: ModuleLink | string): Result<ModuleMemory<T>>;
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
