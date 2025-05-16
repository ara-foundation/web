export enum ModuleCategory {
    NodeJsModule = "node_modules",
}
import { ModuleLink, type ModuleURL } from "@ara-web/sds";

import { 
    EnumTraits,
    OkResult, 
    Result,
    Debug,
 } from "@ara-web/p-hintjens";
import { 
    ModuleMemory,
    type AutoImporter, 
    type ImportedRecords, 
    type ExtensionInterface,
    ProjectMemory, 
    type ModuleMemories,
    BuiltInIdentifiers,
    FilePath,
    type SingleRecord
 } from "../index.js";

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension implements ExtensionInterface {
    private _moduleLink: ModuleLink;
    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    private _moduleMemories: ModuleMemories<unknown> = {};
    private _autoImporter?: AutoImporter;

    constructor() {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", fileModuleLink)
    }

    public getModuleWithFileExtensions(_: ModuleLink): ModuleLink[] {
        return [];
    }

    public get memoryOperatorId(): ModuleLink {
        return this._moduleLink;
    }
    
    public get packageLink(): ModuleLink {
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

    public putPackage = async({importModuleClause, module}: SingleRecord): Promise<Result<ModuleLink>> => {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, module);
        this._moduleMemories[moduleLink.moduleURL] = moduleMemory;

        return Result.ok(moduleLink);
    }

    public putModules = async(params: ImportedRecords|SingleRecord): Promise<Result<ModuleLink[]>> => {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks: ModuleLink[] = [];
        
        if ("records" in params) {
            const importedRecords = params as ImportedRecords;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`)
                }

                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
            }
        } else if ("module" in params) {
            const singleRecord = params as SingleRecord;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`)
            }

            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, singleRecord.module);
            moduleLinks.push(moduleLink);
        } else {
            return Result.fail(`Missing records and importModules properties`, `Pass the correct data`);
        }

        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    }

    public watchModules = (autoImporter: AutoImporter) => {
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

    public getModule<T>(moduleLink: ModuleLink|string): Result<ModuleMemory<T>> {
        if (typeof moduleLink === "string") {
            return Result.fail(`${this.moduleLink.moduleURL} accepts module links only`, `Please pass the absolute path`)
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this.moduleLink.moduleURL], `this.isModuleExist()`, `The link: ${moduleLink}`)
        }
        let module = this._moduleMemories[moduleLink.moduleURL] as ModuleMemory<T>;
        return Result.ok(module)
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
        Debug.log(`Modules:`)
        Debug.log(Object.keys(this._moduleMemories))
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        if (this._moduleMemories[url] !== undefined) {
            return true;
        }
        return false;
    }

    public get moduleCategories(): string[] {
        return EnumTraits.enumValues(ModuleCategory) as string[];
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

    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);

        return moduleMemories.map((memory) => (memory.content as T))
    }

    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
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
        
        projectMemory
        .getModules()
        .filter(
            (module) => 
            module.moduleCategory !== ModuleCategory.NodeJsModule
        ).forEach(
            (module) => 
            {module.addIdentifiers(identifiers.getValue())}
        );
        return Result.ok(projectMemory);
    }

}