import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory } from "./ModuleMemory.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../extension-interface.js";
export type ModuleMemories<T> = {
    [key: ModuleURL]: ModuleMemory<T | unknown>;
};
export declare class ProjectMemory {
    private _memories;
    private _moduleLinksBuilders;
    get memories(): ModuleMemories<unknown>;
    putModuleLinksBuilder(moduleLinksBuilder: PossibleModuleLinksBuilder): void;
    putModuleMemory(moduleMemory: ModuleMemory<unknown>): ModuleLink;
    putModuleMemories(memories: ModuleMemories<unknown>): void;
    /**
     * Cleans the memory that belong to the moduleType category, if the memory module path is
     * not in the given list.
     * @param moduleType
     * @param modulePaths
     * @returns
     */
    cleanMemoryExcept(moduleCategory: string, moduleLinks: ModuleLink[]): void;
    private getPossibleModuleLinks;
    /**
     * Returns all module memories of the moduleType category.
     * @param moduleType
     * @returns
     */
    getModuleMemories<T>(moduleCategory?: string): ModuleMemories<T | unknown>;
    /**
     * Returns all the contents
     * @param moduleCategory
     * @returns
     */
    getModuleContents<T>(moduleCategory?: string): T[];
    /**
     * Converts the import clause into a valid module link within the project memory.
     * @param importClause the import clause to
     * @returns
     */
    getPossibleModuleLink(importClause: string): Result<ModuleLink>;
    getModuleMemory<T>(moduleLink: ModuleLink | ModuleURL): Result<ModuleMemory<T>>;
    /**
     * Put Module Content puts if the module in the URL exists
     * @param moduleURL
     * @param content
     */
    putModuleContent<T>(moduleURL: ModuleURL, content: T): OkResult;
    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey
         * @param filterValue
         */
    print: (filteredModuleCategory?: string, filterKey?: string, filterValue?: any) => void;
}
