import type { OkResult, Result } from "@ara-web/ts-enhancement";
import type { ModuleMemory } from "./memory/ModuleMemory.js";
import type { ProjectMemory } from "./memory/ProjectMemory.js";
import type { ModuleLink } from "./ara-link/ReflectAraLink.js";
import type { CategorizedModules } from "./setup.js";
export type PossibleModuleLinksBuilder = (modulePath: string) => ModuleLink[];
export interface ExtensionInterface {
    name: string;
    namespace: string;
    label: string;
    description: string;
    /**
     * Return the module categories that this extension adds
     */
    moduleCategories: string[];
    /**
     * Whether the given string is one of the supported module categories or not
     * @param moduleCategory
     */
    isSupportedModuleCategory(moduleCategory: string): boolean;
    /**
     * Creates a new module memory and simply returns the instance of the module memory.
     * @param moduleCategory
     * @param modulePath
     * @param glob
     */
    getNewModuleMemory(moduleLink: ModuleLink, glob: unknown): Result<ModuleMemory<unknown>>;
    /**************************************************************************
     * Setup
     * Everything, needed for a Reflect setup in the website
     **************************************************************************/
    /**
     * Categorize the given list of all imported module data
     * @param moduleRecords
     */
    getCategorizedModuleData(moduleRecords: Record<string, unknown>): Result<CategorizedModules>;
    /**************************************************************************
     * Paths
     **************************************************************************/
    getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink>;
    getPossibleModuleLinks: PossibleModuleLinksBuilder;
    /**************************************************************************
     * HOOKS
     **************************************************************************/
    beforeGet?: (moduleCategory: string, projectMemory: ProjectMemory) => Promise<OkResult>;
    afterGet?: (moduleCategory: string, projectMemory: ProjectMemory) => Promise<OkResult>;
}
