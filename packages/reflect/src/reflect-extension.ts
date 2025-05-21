import { ModuleLink, Rest, type ModuleURL } from "@ara-web/sds";
import { 
    OkResult, 
    Result,
 } from "@ara-web/p-hintjens";
import { 
    ModuleMemory,
    type AutoImporter, 
    type ImportedRecords, 
    type ExtensionInterface,
    type ModuleMemories,
    FilePath,
    type SingleRecord,
    type ReflectElementType,
 } from "./index.js";
import { escapeId } from "./reflect-object-tree.js";

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class ReflectExtension implements ExtensionInterface {
    public reflectExtension: boolean = true;
    private _moduleLink: ModuleLink;

    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    private _moduleMemories: ModuleMemories<unknown> = {};
    protected _untrackedModules: ModuleURL[] = [];
    protected _autoImporter?: AutoImporter;

    constructor(moduleLink?: ModuleLink) {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = moduleLink || ModuleLink.newPackageURL("@ara-web", "reflect-extension", fileModuleLink)
    }

    public getModuleWithFileExtensions(_: ModuleLink): ModuleLink[] {
        return [];
    }

    public get untrackedModuleAmount(): number {
        return this._untrackedModules.length;
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

    public get moduleCategories(): string[] {
        return [];
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    public async putPackage({importModuleClause, module, moduleCategory}: SingleRecord & {moduleCategory: string}): Promise<Result<ModuleLink>> {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new ModuleMemory(moduleCategory, moduleLink, module);
        this._moduleMemories[moduleLink.moduleURL] = moduleMemory;
        this._untrackedModules.push(moduleLink.moduleURL);
        return Result.ok(moduleLink);
    }

    public async putModules(params: (ImportedRecords|SingleRecord) & {moduleCategory: string}): Promise<Result<ModuleLink[]>> {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks: ModuleLink[] = [];
        if ("records" in params) {
            const importedRecords = params as ImportedRecords;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`)
                }

                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(params.moduleCategory, moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
                this._untrackedModules.push(moduleLink.moduleURL);
            }
        } else if ("module" in params) {
            const singleRecord = params as SingleRecord;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`)
            }

            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(params.moduleCategory, moduleLink, singleRecord.module);
            this._untrackedModules.push(moduleLink.moduleURL);
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

    protected _autoPut = async(moduleCategory: string): Promise<Result<ModuleLink[]>> => {
        if (this._autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this._autoImporter();
        const putResult = await this.putModules({...imported, moduleCategory});
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
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        if (this._moduleMemories[url] !== undefined) {
            return true;
        }
        return false;
    }

    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);

        return moduleMemories.map((memory) => (memory.content as T))
    }

    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories = this.getModules<T>(moduleCategory);

        return moduleMemories.filter((memory) => (memory.content === undefined));
    }

    public afterCreation(): OkResult {
        this._untrackedModules = [];
        return OkResult.ok();
    }

    protected _trackModules = (rest: Rest<ReflectElementType>): OkResult => {
        if (this._untrackedModules.length === 0) {
            return OkResult.ok();
        }
        
        let moduleURL: ModuleURL | undefined;
        while (moduleURL = this._untrackedModules.shift()) {
            const posted = rest.post!(`#${escapeId(this._moduleLink.moduleURL)}`, this._moduleMemories[moduleURL]);
            if (posted.isFailure) {
                return OkResult.fail(`rest.post(#extension, '${this._moduleLink.moduleURL}'): ${posted.errorTitle}`, posted.errorDescription!);
            }
        }

        return OkResult.ok();
    }
}