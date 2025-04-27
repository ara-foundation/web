import { type ExtensionInterface } from "../extension-interface.js";
import { enumValues, OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "../memory/index.js";
import { ModuleCategory } from "./module.js";
import { EnabledNodejsModules } from "./enabled-nodejs-module.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../extension-interface.js";
import type { CategorizedModules } from "../setup.js";

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class ReflectExtension implements ExtensionInterface {
    constructor() {}
    name = "reflect-nodejs-ext";
    namespace = "@ara-web";

    public get moduleCategories(): string[] {
        return enumValues(ModuleCategory);
    }
    
    public get label(): string {
        return "NodeJs Extension";
    }

    public get description(): string {
        return "Adds support of the Nodejs built in functions and context access"
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    public getNewModuleMemory(moduleLink: ModuleLink, glob: unknown): Result<ModuleMemory<any>> {
        return Result.ok(new ModuleMemory<unknown>(moduleLink, glob));
    }

    public getCategorizedModuleData(moduleRecords: Record<string, unknown>): Result<CategorizedModules> {
        const categorizedModules: CategorizedModules = {
            [ModuleCategory.NodeJsModule]: {}
        };
        for (let modulePath in moduleRecords) {
            categorizedModules[ModuleCategory.NodeJsModule][modulePath] = {
                glob: moduleRecords[modulePath]
            }
        } 

        return Result.ok(categorizedModules);
    }


    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory 
     * @returns 
     */
    public async beforeGet(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> {
        const builtInIdentified = await this.postBuiltInIdentifiers(projectMemory);
        if (builtInIdentified.isFailure) {
            return Result.fail(
                `this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`,
                builtInIdentified.errorDescription!
            )
        }

        if (moduleCategory === ModuleCategory.NodeJsModule) {
            this.postNodeJSContents(projectMemory);
        }

        return OkResult.ok();
    }

    //****************************************************************
    // 
    // Paths
    //
    //****************************************************************

    public getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink> {
        if (!this.isSupportedModuleCategory(moduleCategory)) {
            return Result.fail(`this.isSupportedModuleCategory('${moduleCategory}'): false`, `Please pass the correct module category`)
        }

        const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, filePath);
        return Result.ok(moduleLink);
    }

    public getPossibleModuleLinks: PossibleModuleLinksBuilder = (modulePath: string): ModuleLink[] => {
        const moduleLinks: ModuleLink[] = [];
        const moduleCategories = this.moduleCategories;
        for (let moduleCategory of moduleCategories) {
            const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, modulePath)
            moduleLinks.push(moduleLink)
        }
        return moduleLinks
    }

    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************

    private postNodeJSContents = (projectMemory: ProjectMemory): void => {
        const modules = projectMemory.getModuleMemories(ModuleCategory.NodeJsModule);
        if (modules === undefined) {
            return;
        }

        for (let modulePath in modules) {
            const moduleURL = modulePath as ModuleURL;
            if (modules[moduleURL].content === undefined) {
                modules[moduleURL].content = modules[moduleURL].glob;
            }
        }
    }

    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    //
    private postBuiltInIdentifiers = async (projectMemory: ProjectMemory): Promise<Result<ProjectMemory>> => {
        const identifiers = await EnabledNodejsModules.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(
                `getBuiltInIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(projectMemory);
        }
        
        const moduleMemories = projectMemory.getModuleMemories();
        for (let modulePath in moduleMemories) {
            moduleMemories[modulePath as ModuleURL].addIdentifiers(identifiers.getValue());
        }

        return Result.ok(projectMemory);
    }

}