import { ExtensionOperator, ModuleLink, type ModuleURL, RestfulExtensionOperator } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { Module } from "./module.js";
import type { AutoImporter, ModuleRecords, ModuleCategory, ModuleManager, ModuleRecord } from "./module-manager.js";
export type Modules = {
    [key: ModuleURL]: Module;
};
/**
 * ModuleOperator is the SDSExtension operator that
 * returns ModuleManager. It also acts as the module manager,
 * but simply calls its module managers. :)
 */
export declare class ChiefModuleManager extends RestfulExtensionOperator implements ModuleManager {
    constructor(extOp: ExtensionOperator);
    get modules(): Module[];
    get categories(): string[];
    get packageLink(): ModuleLink;
    isDefinedModuleCategory(category: ModuleCategory): boolean;
    isModuleExist(link: ModuleLink | ModuleURL): boolean;
    getModule: <T>(link: ModuleLink) => Result<Module>;
    getModules: <T>(category?: ModuleCategory) => Module[];
    getModuleWithFileExtensions(link: ModuleLink): ModuleLink[];
    putPackage(_: ModuleRecord): Promise<Result<ModuleLink>>;
    putModules(_: ModuleRecords | ModuleRecord): Promise<Result<ModuleLink[]>>;
    watchModules(_: AutoImporter): void;
    get memOps(): ModuleManager[];
}
