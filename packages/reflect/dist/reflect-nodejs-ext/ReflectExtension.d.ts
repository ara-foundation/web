import { type ExtensionInterface } from "@ara-web/reflect";
import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect/memory";
import { ModuleLink } from "../ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../extension-interface.js";
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
    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory
     * @returns
     */
    beforeGet(_: string, projectMemory: ProjectMemory): Promise<OkResult>;
    getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink>;
    getPossibleModuleLinks: PossibleModuleLinksBuilder;
    private postBuiltInIdentifiers;
}
