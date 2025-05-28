// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { ExtensionOperator, ModuleLink, type ModuleURL, RestfulExtensionOperator } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { Module } from "./module.js";
import type { AutoImporter, ModuleRecords, ModuleCategory, ModuleManager, ModuleRecord } from "./module-manager.js";
import { MEMOP_TAG } from "./reflect-object-tree.js";

export type Modules = { [key: ModuleURL]: Module };

const packageLink = ModuleLink.newPackageLink('@ara-web', 'reflect', 'module-manager-operator');

/**
 * ModuleOperator is the SDSExtension operator that
 * returns ModuleManager. It also acts as the module manager,
 * but simply calls its module managers. :)
 */
export class ChiefModuleManager extends RestfulExtensionOperator implements ModuleManager {
    constructor(extOp: ExtensionOperator) {
        super(packageLink, MEMOP_TAG, extOp)
    }
    public get modules(): Module[] {
        return this.exts.reduce((memories, ext) => {
            memories = [...memories, ...(ext as ModuleManager).modules]
            return memories;
        }, [] as Module[]);
    }
    
    public get categories(): string[] {
        return this.exts.reduce((categories, moduleManager) => {
            categories = [...categories, ...(moduleManager as ModuleManager).categories]
            return categories;
        }, [] as string[])
    }

    get packageLink(): ModuleLink {
        return packageLink;
    }

    isDefinedModuleCategory(category: ModuleCategory): boolean {
        return this.exts.some(ext => (ext as ModuleManager).isDefinedModuleCategory(category));
    }

    isModuleExist(link: ModuleLink | ModuleURL): boolean {
        return this.exts.some(ext => (ext as ModuleManager).isModuleExist(link));
    }

    getModule = <T>(link: ModuleLink): Result<Module> => {
        for (const ext of this.exts) {
            const result = (ext as ModuleManager).getModule(link);
            if (result.isSuccess) {
                return result;
            }
        }
        return Result.fail("Module not found", `The given '${link.url}' not found`);
    };

    getModules = <T>(category?: ModuleCategory): Module[] => {
        let modules: Module[] = [];
        for (const ext of this.exts) {
            modules = modules.concat((ext as ModuleManager).getModules(category));
        }
        return modules;
    };

    getModuleWithFileExtensions(link: ModuleLink): ModuleLink[] {
        for (const ext of this.exts) {
            const links = (ext as ModuleManager).getModuleWithFileExtensions(link);
            if (links && links.length > 0) {
                return links;
            }
        }
        return [];
    }

    putPackage(_: ModuleRecord): Promise<Result<ModuleLink>> {
        throw new Error("Chief Module Manager can not put package, delegate to the module managers");
    }
    putModules(_: ModuleRecords | ModuleRecord): Promise<Result<ModuleLink[]>> {
        throw new Error("Chief Module Manager can not put modules, delegate to the module managers");
    }
    watchModules(_: AutoImporter): void {
        throw new Error("Chief Module Manager won't watch modules, delegate to the module managers");
    }

    public get memOps(): ModuleManager[] {
        return this.exts as ModuleManager[];
    }
}
