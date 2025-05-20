// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { ModuleLink, type ModuleURL } from "@ara-web/sds";

import { 
    Debug,
    Result
 } from "@ara-web/p-hintjens";
import { ModuleMemory } from "./module-memory.js";
import type { MemoryOperations } from "./extension-interface.js";

export type ModuleMemories<T> = {[key: ModuleURL]: ModuleMemory<T|unknown>};

//  purl -> memory of Ceo.tsx
/**
 * `ProjectMemory` links all the module memories between extensions. 
 */
export class ProjectMemory implements MemoryOperations {
    private _memOps: MemoryOperations[] = [];
    private _moduleLink: ModuleLink;

    constructor() {
        const absPath = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL(`@ara-web`, `reflect`, absPath, 'memory/ProjectMemory')
    }

    public get memOps(): MemoryOperations[] {
        return this._memOps;
    }
    
    /**
     * Return the module file paths from the link
     * @param moduleLink 
     * @returns 
     */
    public getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[] {
        if (moduleLink.isPkgURL) {
            return [moduleLink];
        }
        let filePaths: ModuleLink[] = [];
        for (let memOp of this._memOps) {
            const memOpModules = memOp.getModuleWithFileExtensions(moduleLink);
            filePaths = [...filePaths, ...memOpModules];
        }

        return filePaths;
    }

    /**
     * My ID;
     */
    public get memoryOperatorId(): ModuleLink {
        return this._moduleLink;
    }

    /**
     * Register extensions
     * @param memOp 
     */
    public putMemoryOperations = (...memOp: MemoryOperations[]): void => {
        this._memOps.push(...memOp);
    }

    /**
     * Return the module memory by the module link.
     * @param moduleLink 
     * @returns 
     */
    public getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>> {
        // no scripts/reflect, so fetch
        for (let memOp of this._memOps) {
            const module = memOp.getModule<T>(moduleLink);
            if (module.isSuccess) {
                return module;
            }
        }

        // didn't work? let's find from the possible file extensions
        return Result.fail(`Module ${moduleLink} not found in any of the memory operations`, `Are you sure that it exists?`);
    }

    public getModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        let modules: ModuleMemory<T>[] = [];
        for (let memOp of this._memOps) {
            const memOpModules = memOp.getModules<T>(moduleCategory);
            modules = [...modules, ...memOpModules];
        }

        return modules;
    }

    public isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean {
        if (moduleLink.toString() === this._moduleLink.toString()) {
            return true;
        }
        for (let memOp of this._memOps) {
            const exist = memOp.isModuleExist(moduleLink);
            if (exist) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the modules that doesn't have contents
     * @param moduleCategory 
     */
    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        let modules: ModuleMemory<T>[] = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModules<T>(moduleCategory)];
        }

        return modules;
    }

    /**
     * Returns all the contents
     * @param moduleCategory 
     * @returns 
     */
    public getModuleContents<T>(moduleCategory?: string): T[] {
        let modules: T[] = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModuleContents<T>(moduleCategory)];
        }

        return modules;
    }

    /**
     * For debug purpose, dump the reflect to print everything.
     * @param filterKey 
     * @param filterValue 
     */
    public print = (filteredModuleCategory?: string, filterKey?: string, filterValue?: any): void => {
        let categoryModules = this.getModules(filteredModuleCategory);

        Debug.push(`Project Memory:`)
        for (let module of categoryModules) {
            Debug.log(`The '${module.moduleLink}' module:`);
            module.print(filterKey, filterValue)
        }
            
        Debug.pop();
    }
}
