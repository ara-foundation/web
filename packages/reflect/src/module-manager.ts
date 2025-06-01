import { ModuleLink, type ModuleURL, type Restful, type Extendable } from "@ara-web/sds";
import { OkResult, type Result } from "@ara-web/p-hintjens";
import { Module } from "./module.js";
import { type ReflectDataType } from "./reflect-object-tree.js";

export type NamespaceObject = unknown;
export type ModulePath = string;
export type ModuleCategory = string;
export type AbsoluteFilePath = string;

/**
 * A type of imported records fetched by `import.meta.glob` if you use `vite` plugin.
 * The `importingFilePath` property is the module that records. You may set it using `import.meta.filename`
 */
export type ModuleRecords = {records: Record<ModulePath, NamespaceObject>, importMetaFilename?: AbsoluteFilePath};
export type ModuleRecord =  {module: NamespaceObject, importModuleClause: ModulePath, importMetaFilename?: AbsoluteFilePath}

/**
 * A function that imports the modules automatically before any `get` operation.
 */
export type AutoImporter = () => ModuleRecords;

/**
 * Handles certain type of module memories.
 * This is an SDS Extension interface. Any Reflect plugins must extend it.
 */
export interface ModuleManager extends Extendable {
    modules: Module[]; // returns module memories that were tracked
    categories: ModuleCategory[];
    isDefinedModuleCategory(category: ModuleCategory): boolean;
    isModuleExist(link: ModuleLink|ModuleURL): boolean;
    getModule: (link: ModuleLink) => Result<Module>;
    getModules: (category?: ModuleCategory) => Module[];

    /**
     * If the module link is a file and doesn't have file extension, it will populate it.
     * 
     * Used by {@link Code} when linting import clauses into module link. Import Clause might be without extension. 
     * @param link 
     */
    getModuleWithFileExtensions(link: ModuleLink): ModuleLink[];
    
    putPackage(record: ModuleRecord): Promise<Result<ModuleLink>>;
    putModules(recordOrRecords: ModuleRecords|ModuleRecord): Promise<Result<ModuleLink[]>>;

    /**************************************************************************
     * HOOKS that Reflect will call
     **************************************************************************/
    
    beforeAny?(rest: Restful<ReflectDataType>): Promise<OkResult>;

    beforeGet?(selector: string, rest: Restful<ReflectDataType>): Promise<OkResult>;
    afterGet?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;

    beforePut?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;
    afterPut?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;

    beforePost?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;
    afterPost?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;

    beforePatch?<AttrType>(selector: string, rest: Restful<ReflectDataType>, data?: AttrType): Promise<OkResult>;
    afterPatch?<AttrType>(selector: string, rest: Restful<ReflectDataType>, data?: AttrType): Promise<OkResult>;

    beforeDelete?(selector: string, rest: Restful<ReflectDataType>): Promise<OkResult>;
    afterDelete?(selector: string, rest: Restful<ReflectDataType>, data?: ReflectDataType): Promise<OkResult>;
}
