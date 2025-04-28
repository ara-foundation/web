import { type ExtensionInterface } from "../extension-interface.js";
import { Debug, enumValues, OkResult, Result } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory, type ModuleMemories } from "../memory/index.js";
import { ModuleCategory } from "./module.js";
import { BuiltInIdentifiers } from "./BuiltInIdentifiers.js";
import { ModuleLink, type ModuleURL } from "../ara-link/ModuleLink.js";
import type { AutoImporter, ImportedRecords } from "../extension-interface.js";
import { FilePath } from "../module.js";
import PathModule from "node:path"

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension implements ExtensionInterface {
    private _moduleLink: ModuleLink;
    private _moduleMemories: ModuleMemories<unknown> = {};
    private _autoImporter?: AutoImporter;

    constructor() {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", fileModuleLink)
    }
    public get operatorId(): ModuleLink {
        return this.moduleLink;
    }
    
    public get moduleLink(): ModuleLink {
        return this._moduleLink;
    }

    public get moduleMemories(): ModuleMemory<unknown>[] {
        return Object.values(this._moduleMemories);
    }

    public get description(): string {
        return "Adds support of the Nodejs built in functions and context access"
    }

    public putPackage = async(importedRecords: ImportedRecords & {importClause: string}): Promise<Result<ModuleLink>> => {
        for (let filePath in importedRecords.records) {
            const absPath = await FilePath.getFileAbsolutePath(filePath, importedRecords.importingFilePath);
            if (!(await FilePath.isFileExist(absPath))) {
                return Result.fail(`FilePath.isFileExist('${absPath.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importingFilePath}' locates to a file`)
            }

            let [possibleNamespaceOrName, name, ...subDirs] = importedRecords.importClause.split("/");

            const subPath = subDirs.length === 0 ? undefined : PathModule.join(...subDirs);
            name = name === undefined || name.length === 0 ? possibleNamespaceOrName : name;
            const namespace = possibleNamespaceOrName === name ? undefined : possibleNamespaceOrName;
            
            const moduleLink = ModuleLink.newPackageURL(namespace, name, absPath, subPath);
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory<unknown>(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
            
            return Result.ok(moduleLink);
        }
        return Result.fail(`No record to put in`, `Please pass the correct node`);
    }

    public putModules = async(importedRecords: ImportedRecords): Promise<Result<ModuleLink[]>> => {
        const moduleLinks: ModuleLink[] = [];
        for (let filePath in importedRecords.records) {
            const moduleLink = await FilePath.getFileAbsolutePath(filePath, importedRecords.importingFilePath);
            if (!(await FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importingFilePath}' locates to a file`)
            }

            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory<unknown>(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
            moduleLinks.push(moduleLink);
        }

        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    }

    public watchModules = async(autoImporter: AutoImporter) => {
        this._autoImporter = autoImporter;
    }

    private _autoPut = async(_: string): Promise<Result<ModuleLink[]>> => {
        if (this._autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this._autoImporter();
        const putResult = await this.putModules(imported);
        if (putResult.isFailure) {
            return Result.fail(`this.putModules(): ${putResult.errorTitle}`, putResult.errorDescription!);
        }
        return Result.ok(putResult.getValue());
    }

    public getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>> {
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404(['reflect-nodejs-ext', 'ReflectExtension'], `this.isModuleExist()`, `The link: ${moduleLink}`)
        }
        return Result.ok(this._moduleMemories[moduleLink.moduleURL] as ModuleMemory<T>);
    }

    public getModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories: ModuleMemory<T>[] = [];
        for (let moduleMemory of this.moduleMemories) {
            if (moduleCategory === undefined || moduleMemory.moduleCategory === moduleCategory) {
                moduleMemories.push(moduleMemory as ModuleMemory<T>);
            }
        }
        return moduleMemories;
    }

    public isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean {
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        return this._moduleMemories[url] !== undefined;
    }

    public get moduleCategories(): string[] {
        return enumValues(ModuleCategory);
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory 
     * @returns 
     */
    public async beforeGet(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(moduleCategory);
            if (result.isFailure) {
                return Result.fail(`this._autoPut('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription!);
            }
        }
        
        const builtInIdentified = await this.postBuiltInIdentifiers(projectMemory);
        if (builtInIdentified.isFailure) {
            return Result.fail(
                `this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`,
                builtInIdentified.errorDescription!
            )
        }

        if (moduleCategory === ModuleCategory.NodeJsModule) {
            this.postNodeJSContents();
        }

        return OkResult.ok();
    }

    //****************************************************************
    // 
    // Paths
    //
    //****************************************************************

    // public getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink> {
    //     if (!this.isSupportedModuleCategory(moduleCategory)) {
    //         return Result.fail(`this.isSupportedModuleCategory('${moduleCategory}'): false`, `Please pass the correct module category`)
    //     }

    //     const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, filePath);
    //     return Result.ok(moduleLink);
    // }

    // public getPossibleModuleLinks: PossibleModuleLinksBuilder = (modulePath: string): ModuleLink[] => {
    //     const moduleLinks: ModuleLink[] = [];
    //     const moduleCategories = this.moduleCategories;
    //     for (let moduleCategory of moduleCategories) {
    //         const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, modulePath)
    //         moduleLinks.push(moduleLink)
    //     }
    //     return moduleLinks
    // }

    getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);

        return moduleMemories.map((memory) => (memory.content as T))
    }

    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories = this.getModules<T>(moduleCategory);

        return moduleMemories.filter((memory) => (memory.content === undefined));
    }

    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************

    private postNodeJSContents = (): void => {
        const modules = this.getNoContentModules(ModuleCategory.NodeJsModule);

        for (let module of modules) {
            module.content = module.glob;
        }
    }

    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    // Except for the NodeJS extension itself.
    //
    private postBuiltInIdentifiers = async (projectMemory: ProjectMemory): Promise<Result<ProjectMemory>> => {
        const identifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
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
        
        const moduleMemories = projectMemory.getModules();
        for (let module of moduleMemories) {
            if (module.moduleCategory === ModuleCategory.NodeJsModule) {
                continue;
            }
            module.addIdentifiers(identifiers.getValue());
        }

        return Result.ok(projectMemory);
    }

}