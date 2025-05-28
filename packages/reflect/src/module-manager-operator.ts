// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { ExtensionOperator, ModuleLink, type ModuleURL, RestfulExtensionOperator } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "./module-memory.js";
import type { AutoImporter, ModuleRecords, ModuleCategory, ModuleManager, ModuleRecord } from "./module-manager.js";
import { MEMOP_TAG } from "./reflect-object-tree.js";

export type ModuleMemories<T> = { [key: ModuleURL]: ModuleMemory<T | unknown> };

const packageLink = ModuleLink.newPackageLink('@ara-web', 'reflect', 'module-manager-operator');

//  purl -> memory of Ceo.tsx
/**
 * `ProjectMemory` links all the module memories between extensions. 
 */
export class ModuleMemoryOperator extends RestfulExtensionOperator implements ModuleManager {
    constructor(extOp: ExtensionOperator) {
        super(packageLink, MEMOP_TAG, extOp)
    }
    public get memories(): ModuleMemory<unknown>[] {
        return this.exts.reduce((memories, ext) => {
            memories = [...memories, ...(ext as ModuleManager).memories]
            return memories;
        }, [] as ModuleMemory<unknown>[]);
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

    getModule = <T>(link: ModuleLink): Result<ModuleMemory<T>> => {
        for (const ext of this.exts) {
            const result = (ext as ModuleManager).getModule<T>(link);
            if (result && (result as any).ok) {
                return result;
            }
        }
        return Result.fail("Module not found", `The given '${link.url}' not found`);
    };

    getModules = <T>(category?: ModuleCategory): ModuleMemory<T>[] => {
        let modules: ModuleMemory<T>[] = [];
        for (const ext of this.exts) {
            modules = modules.concat((ext as ModuleManager).getModules<T>(category));
        }
        return modules;
    };

    getModuleContents<T>(category?: ModuleCategory): T[] {
        return this.getModules<T>(category).map(m => m.content as T);
    }

    getNoContentModules<T>(category?: ModuleCategory): ModuleMemory<T>[] {
        return this.getModules<T>(category).filter(m => m.content == null);
    }

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
        throw new Error("Method not implemented.");
    }
    putModules(_: ModuleRecords | ModuleRecord): Promise<Result<ModuleLink[]>> {
        throw new Error("Method not implemented.");
    }
    watchModules(_: AutoImporter): void {
        throw new Error("Method not implemented.");
    }

    public get memOps(): ModuleManager[] {
        return this.exts as ModuleManager[];
    }
}
