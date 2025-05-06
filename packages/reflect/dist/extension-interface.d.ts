import type { OkResult, Result, ModuleLink, ModuleURL } from "@ara-web/p-hintjens";
import type { ModuleMemory } from "./ModuleMemory.js";
import type { ProjectMemory } from "./ProjectMemory.js";
import type { SDSExtensionInterface } from "@ara-web/p-hintjens/sds";
export type Module = unknown;
export type ModulePath = string;
export type ModuleCategory = string;
export type AbsoluteFilePath = string;
/**
 * A type of imported records fetched by `import.meta.glob` if you use `vite` plugin.
 * The `importingFilePath` property is the module that records. You may set it using `import.meta.filename`
 */
export type ImportedRecords = {
    records: Record<ModulePath, Module>;
    importMetaFilename?: AbsoluteFilePath;
};
export type SingleRecord = {
    module: Module;
    importModuleClause: ModulePath;
    importMetaFilename?: AbsoluteFilePath;
};
/**
 * A function that imports the modules automatically before any `get` operation.
 */
export type AutoImporter = () => ImportedRecords;
/**
 * Memory Operations provided by the Extension. By design used by the `ProjectMemory`
 * to link the data between extension modules.
 */
export interface MemoryOperations {
    /**
     * To identify the extension that provides the memory operations
     */
    memoryOperatorId: ModuleLink;
    /**
     * Returns the Module Memory by the provided module link by the module link
     * @param moduleLink
     */
    getModule: <T>(moduleLink: ModuleLink) => Result<ModuleMemory<T>>;
    /**
     * Returns all the modules that match to the category
     * @param moduleCategory?
     * @returns
     */
    getModules: <T>(moduleCategory?: ModuleCategory) => ModuleMemory<T>[];
    /**
     * Checks does the module exist in the extension
     * @param moduleLink
     */
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    getModuleContents<T>(moduleCategory?: ModuleCategory): T[];
    getNoContentModules<T>(moduleCategory?: ModuleCategory): ModuleMemory<T>[];
    /**
     * If the module link is a file and doesn't have file extension, it will populate it.
     *
     * Used by {@link Code} when linting import clauses into module link. Import Clause might be without extension.
     * @param moduleLink
     */
    getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[];
}
/**
 * Extension Interface that all module handlers based on.
 */
export interface ExtensionInterface extends MemoryOperations, SDSExtensionInterface {
    moduleMemories: ModuleMemory<unknown>[];
    /**
     * Return the module categories that this extension adds
     */
    moduleCategories: ModuleCategory[];
    /**
    //  * Whether the given value is one of the supported module categories or not
    //  * @param moduleCategory
    //  */
    isSupportedModuleCategory(moduleCategory: ModuleCategory): boolean;
    /**************************************************************************
     * Setup
     * Everything, needed for a Reflect setup in the website
     **************************************************************************/
    /**
     * Put the record as the `name` NPM package.
     *
     * `ext.putPackge({records, importingFilePath: import.meta.fileName, importClause: 'npm-url'})`
     */
    putPackage(importedRecords: SingleRecord): Promise<Result<ModuleLink>>;
    /**
     * Put the record as the module in the file system.
     */
    putModules(importedRecords: ImportedRecords | SingleRecord): Promise<Result<ModuleLink[]>>;
    /**
     * Auto Importer is to put the modules automatically using the auto importer.
     * @param autoImporter
     */
    watchModules(autoImporter: AutoImporter): void;
    /**************************************************************************
     * HOOKS
     **************************************************************************/
    beforeGet?: (moduleCategory: ModuleCategory, projectMemory: ProjectMemory) => Promise<OkResult>;
    afterGet?: (moduleCategory: ModuleCategory, projectMemory: ProjectMemory) => Promise<OkResult>;
}
