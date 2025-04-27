import { type ExtensionInterface } from "../extension-interface.js";
import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "../memory/index.js";
import { ModuleLink } from "../ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../extension-interface.js";
import type { CategorizedModules } from "../setup.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class ReflectExtension implements ExtensionInterface {
    constructor();
    name: string;
    namespace: string;
    get moduleCategories(): string[];
    get label(): string;
    get description(): string;
    isSupportedModuleCategory(moduleCategory: string): boolean;
    getNewModuleMemory(moduleLink: ModuleLink, glob: unknown): Result<ModuleMemory<any>>;
    getCategorizedModuleData(moduleRecords: Record<string, unknown>): Result<CategorizedModules>;
    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory
     * @returns
     */
    beforeGet(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult>;
    getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink>;
    getPossibleModuleLinks: PossibleModuleLinksBuilder;
    private postNodeJSContents;
    private postBuiltInIdentifiers;
}
