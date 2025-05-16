export declare enum ModuleCategory {
    NodeJsModule = "node_modules"
}
import { ModuleLink, type ModuleURL } from "@ara-web/sds";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleMemory, type AutoImporter, type ImportedRecords, type ExtensionInterface, ProjectMemory, type SingleRecord } from "../index.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class NodejsReflectExtension implements ExtensionInterface {
    private _moduleLink;
    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    private _moduleMemories;
    private _autoImporter?;
    constructor();
    getModuleWithFileExtensions(_: ModuleLink): ModuleLink[];
    get memoryOperatorId(): ModuleLink;
    get packageLink(): ModuleLink;
    get moduleLink(): ModuleLink;
    get moduleMemories(): ModuleMemory<unknown>[];
    get description(): string;
    putPackage: ({ importModuleClause, module }: SingleRecord) => Promise<Result<ModuleLink>>;
    putModules: (params: ImportedRecords | SingleRecord) => Promise<Result<ModuleLink[]>>;
    watchModules: (autoImporter: AutoImporter) => void;
    private _autoPut;
    getModule<T>(moduleLink: ModuleLink | string): Result<ModuleMemory<T>>;
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
