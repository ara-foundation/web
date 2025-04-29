import type { OkResult, Result } from "@ara-web/ts-enhancement/result";
import type { ModuleMemory } from "./memory/ModuleMemory.js";
import type { ProjectMemory } from "./memory/ProjectMemory.js";
import type { ModuleLink, ModuleURL } from "@ara-web/ts-enhancement/module-link";
/**
 * A type of imported records fetched by `import.meta.glob` if you use `vite` plugin.
 * The `importingFilePath` property is the module that records. You may set it using `import.meta.filename`
 */
export type ImportedRecords = {
    records: Record<string, unknown>;
    importingFilePath: string;
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
    operatorId: ModuleLink;
    /**
     * Returns the Module Memory by the provided module link by the module link
     * @param moduleLink
     */
    getModule: <T>(moduleLink: ModuleLink | string) => Result<ModuleMemory<T>>;
    /**
     * Returns all the modules that match to the category
     * @param moduleCategory?
     * @returns
     */
    getModules: <T>(moduleCategory?: string) => ModuleMemory<T>[];
    /**
     * Checks does the module exist in the extension
     * @param moduleLink
     */
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    getModuleContents<T>(moduleCategory?: string): T[];
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
}
/**
 * Extension Interface that all module handlers based on.
 */
export interface ExtensionInterface extends MemoryOperations {
    description: string;
    moduleLink: ModuleLink;
    moduleMemories: ModuleMemory<unknown>[];
    /**
     * Return the module categories that this extension adds
     */
    moduleCategories: string[];
    /**
    //  * Whether the given string is one of the supported module categories or not
    //  * @param moduleCategory
    //  */
    isSupportedModuleCategory(moduleCategory: string): boolean;
    /**************************************************************************
     * Setup
     * Everything, needed for a Reflect setup in the website
     **************************************************************************/
    /**
     * Put the record as the `name` NPM package.
     *
     * `ext.putPackge({records, importingFilePath: import.meta.fileName, importClause: 'npm-url'})`
     */
    putPackage(importedRecords: ImportedRecords & {
        importClause: string;
    }): Promise<Result<ModuleLink>>;
    /**
     * Put the record as the module in the file system.
     */
    putModules(importedRecords: ImportedRecords): Promise<Result<ModuleLink[]>>;
    /**
     * Auto Importer is to put the modules automatically using the auto importer.
     * @param autoImporter
     */
    watchModules(autoImporter: AutoImporter): void;
    /**************************************************************************
     * HOOKS
     **************************************************************************/
    beforeGet?: (moduleCategory: string, projectMemory: ProjectMemory) => Promise<OkResult>;
    afterGet?: (moduleCategory: string, projectMemory: ProjectMemory) => Promise<OkResult>;
}
