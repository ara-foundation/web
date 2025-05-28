// ModuleCategory => Module Path => Module Memory
// E.g.
//  Page -> Index -> memory of index
import { ExtensionOperator, ModuleLink, RestfulExtensionOperator } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { Module } from "./module.js";
import { MEMOP_TAG } from "./reflect-object-tree.js";
const packageLink = ModuleLink.newPackageLink('@ara-web', 'reflect', 'module-manager-operator');
/**
 * ModuleOperator is the SDSExtension operator that
 * returns ModuleManager. It also acts as the module manager,
 * but simply calls its module managers. :)
 */
export class ChiefModuleManager extends RestfulExtensionOperator {
    constructor(extOp) {
        super(packageLink, MEMOP_TAG, extOp);
    }
    get modules() {
        return this.exts.reduce((memories, ext) => {
            memories = [...memories, ...ext.modules];
            return memories;
        }, []);
    }
    get categories() {
        return this.exts.reduce((categories, moduleManager) => {
            categories = [...categories, ...moduleManager.categories];
            return categories;
        }, []);
    }
    get packageLink() {
        return packageLink;
    }
    isDefinedModuleCategory(category) {
        return this.exts.some(ext => ext.isDefinedModuleCategory(category));
    }
    isModuleExist(link) {
        return this.exts.some(ext => ext.isModuleExist(link));
    }
    getModule = (link) => {
        for (const ext of this.exts) {
            const result = ext.getModule(link);
            if (result && result.ok) {
                return result;
            }
        }
        return Result.fail("Module not found", `The given '${link.url}' not found`);
    };
    getModules = (category) => {
        let modules = [];
        for (const ext of this.exts) {
            modules = modules.concat(ext.getModules(category));
        }
        return modules;
    };
    getModuleWithFileExtensions(link) {
        for (const ext of this.exts) {
            const links = ext.getModuleWithFileExtensions(link);
            if (links && links.length > 0) {
                return links;
            }
        }
        return [];
    }
    putPackage(_) {
        throw new Error("Method not implemented.");
    }
    putModules(_) {
        throw new Error("Method not implemented.");
    }
    watchModules(_) {
        throw new Error("Method not implemented.");
    }
    get memOps() {
        return this.exts;
    }
}
