import {} from "@ara-web/reflect";
import { enumValues, OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect/memory";
import { ModuleCategory } from "./module.js";
import { EnabledNodejsModules } from "./enabled-nodejs-module.js";
import { ModuleLink } from "../ara-link/ReflectAraLink.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class ReflectExtension {
    constructor() { }
    name = "reflect-nodejs-ext";
    namespace = "@ara-web";
    get moduleCategories() {
        return enumValues(ModuleCategory);
    }
    get label() {
        return "NodeJs Extension";
    }
    get description() {
        return "Adds support of the Nodejs built in functions and context access";
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    getNewModuleMemory(moduleLink, glob) {
        return Result.ok(new ModuleMemory(moduleLink, glob));
    }
    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory
     * @returns
     */
    async beforeGet(_, projectMemory) {
        const builtInIdentified = await this.postBuiltInIdentifiers(projectMemory);
        if (builtInIdentified.isFailure) {
            return Result.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
        }
        return OkResult.ok();
    }
    //****************************************************************
    // 
    // Paths
    //
    //****************************************************************
    getNewModuleLink(moduleCategory, filePath) {
        if (!this.isSupportedModuleCategory(moduleCategory)) {
            return Result.fail(`this.isSupportedModuleCategory('${moduleCategory}'): false`, `Please pass the correct module category`);
        }
        const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, filePath);
        return Result.ok(moduleLink);
    }
    getPossibleModuleLinks = (modulePath) => {
        const moduleLinks = [];
        const moduleCategories = this.moduleCategories;
        for (let moduleCategory of moduleCategories) {
            const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, modulePath);
            moduleLinks.push(moduleLink);
        }
        return moduleLinks;
    };
    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************
    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    //
    postBuiltInIdentifiers = async (projectMemory) => {
        const identifiers = await EnabledNodejsModules.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(projectMemory);
        }
        const moduleMemories = projectMemory.getModuleMemories();
        for (let modulePath in moduleMemories) {
            moduleMemories[modulePath].addIdentifiers(identifiers.getValue());
        }
        return Result.ok(projectMemory);
    };
}
