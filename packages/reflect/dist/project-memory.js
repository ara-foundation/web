// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { ModuleLink } from "@ara-web/sds";
import { Debug, Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "./module-memory.js";
//  purl -> memory of Ceo.tsx
/**
 * `ProjectMemory` links all the module memories between extensions.
 */
export class ProjectMemory {
    _memOps = [];
    _moduleLink;
    constructor() {
        const absPath = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL(`@ara-web`, `reflect`, absPath, 'memory/ProjectMemory');
    }
    /**
     * Return the module file paths from the link
     * @param moduleLink
     * @returns
     */
    getModuleWithFileExtensions(moduleLink) {
        if (moduleLink.isPkgURL) {
            return [moduleLink];
        }
        let filePaths = [];
        for (let memOp of this._memOps) {
            const memOpModules = memOp.getModuleWithFileExtensions(moduleLink);
            filePaths = [...filePaths, ...memOpModules];
        }
        return filePaths;
    }
    /**
     * My ID;
     */
    get memoryOperatorId() {
        return this._moduleLink;
    }
    /**
     * Register extensions
     * @param memOp
     */
    putMemoryOperations = (...memOp) => {
        this._memOps.push(...memOp);
    };
    /**
     * Return the module memory by the module link.
     * @param moduleLink
     * @returns
     */
    getModule(moduleLink) {
        // no scripts/reflect, so fetch
        for (let memOp of this._memOps) {
            const module = memOp.getModule(moduleLink);
            if (module.isSuccess) {
                return module;
            }
        }
        // didn't work? let's find from the possible file extensions
        return Result.fail(`Module ${moduleLink} not found in any of the memory operations`, `Are you sure that it exists?`);
    }
    getModules(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            const memOpModules = memOp.getModules(moduleCategory);
            modules = [...modules, ...memOpModules];
        }
        return modules;
    }
    isModuleExist(moduleLink) {
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
     * Returns all module memories of the moduleType category.
     * @param moduleType
     * @returns
     */
    /**
     * Returns the modules that doesn't have contents
     * @param moduleCategory
     */
    getNoContentModules(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModules(moduleCategory)];
        }
        return modules;
    }
    /**
     * Returns all the contents
     * @param moduleCategory
     * @returns
     */
    getModuleContents(moduleCategory) {
        let modules = [];
        for (let memOp of this._memOps) {
            modules = [...modules, ...memOp.getModuleContents(moduleCategory)];
        }
        return modules;
    }
    /**
         * For debug purpose, dump the reflect to print everything.
         * @param filterKey
         * @param filterValue
         */
    print = (filteredModuleCategory, filterKey, filterValue) => {
        let categoryModules = this.getModules(filteredModuleCategory);
        Debug.push(`Project Memory:`);
        for (let module of categoryModules) {
            Debug.log(`The '${module.moduleLink}' module:`);
            module.print(filterKey, filterValue);
        }
        Debug.pop();
    };
}
