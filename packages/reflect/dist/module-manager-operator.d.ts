import { ExtensionOperator, ModuleLink, type ModuleURL, RestfulExtensionOperator } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "./module-memory.js";
import type { AutoImporter, ModuleRecords, ModuleCategory, ModuleManager, ModuleRecord } from "./module-manager.js";
export type ModuleMemories<T> = {
    [key: ModuleURL]: ModuleMemory<T | unknown>;
};
/**
 * `ProjectMemory` links all the module memories between extensions.
 */
export declare class ModuleMemoryOperator extends RestfulExtensionOperator implements ModuleManager {
    constructor(extOp: ExtensionOperator);
    get memories(): ModuleMemory<unknown>[];
    get categories(): string[];
    get packageLink(): ModuleLink;
    isDefinedModuleCategory(category: ModuleCategory): boolean;
    isModuleExist(link: ModuleLink | ModuleURL): boolean;
    getModule: <T>(link: ModuleLink) => Result<ModuleMemory<T>>;
    getModules: <T>(category?: ModuleCategory) => ModuleMemory<T>[];
    getModuleContents<T>(category?: ModuleCategory): T[];
    getNoContentModules<T>(category?: ModuleCategory): ModuleMemory<T>[];
    getModuleWithFileExtensions(link: ModuleLink): ModuleLink[];
    putPackage(_: ModuleRecord): Promise<Result<ModuleLink>>;
    putModules(_: ModuleRecords | ModuleRecord): Promise<Result<ModuleLink[]>>;
    watchModules(_: AutoImporter): void;
    get memOps(): ModuleManager[];
}
