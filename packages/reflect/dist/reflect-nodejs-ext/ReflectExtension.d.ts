import { type ExtensionInterface } from "../extension-interface.js";
import { OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "../memory/index.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ModuleLink.js";
import type { AutoImporter, ImportedRecords } from "../extension-interface.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class NodejsReflectExtension implements ExtensionInterface {
    private _moduleLink;
    private _moduleMemories;
    private _autoImporter?;
    constructor();
    get operatorId(): ModuleLink;
    get moduleLink(): ModuleLink;
    get moduleMemories(): ModuleMemory<unknown>[];
    get description(): string;
    putPackage: (importedRecords: ImportedRecords & {
        importClause: string;
    }) => Promise<Result<ModuleLink>>;
    putModules: (importedRecords: ImportedRecords) => Promise<Result<ModuleLink[]>>;
    watchModules: (autoImporter: AutoImporter) => Promise<void>;
    private _autoPut;
    getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>>;
    getModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    get moduleCategories(): string[];
    isSupportedModuleCategory(moduleCategory: string): boolean;
    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory
     * @returns
     */
    beforeGet(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult>;
    getModuleContents<T>(moduleCategory?: string): T[];
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    private postNodeJSContents;
    private postBuiltInIdentifiers;
}
