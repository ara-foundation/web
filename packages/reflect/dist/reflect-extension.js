import { ModuleLink, Rest } from "@ara-web/sds";
import { OkResult, Result, } from "@ara-web/p-hintjens";
import { ModuleMemory, FilePath, } from "./index.js";
import { escapeId } from "./reflect-object-tree.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class ReflectExtension {
    reflectExtension = true;
    _moduleLink;
    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    _moduleMemories = {};
    _untrackedModules = [];
    _autoImporter;
    constructor(moduleLink) {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = moduleLink || ModuleLink.newPackageURL("@ara-web", "reflect-extension", fileModuleLink);
    }
    getModuleWithFileExtensions(_) {
        return [];
    }
    get untrackedModuleAmount() {
        return this._untrackedModules.length;
    }
    get memoryOperatorId() {
        return this._moduleLink;
    }
    get packageLink() {
        return this.moduleLink;
    }
    get moduleLink() {
        return this._moduleLink;
    }
    get moduleMemories() {
        return Object.values(this._moduleMemories);
    }
    get moduleCategories() {
        return [];
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    async putPackage({ importModuleClause, module, moduleCategory }) {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new ModuleMemory(moduleCategory, moduleLink, module);
        this._moduleMemories[moduleLink.moduleURL] = moduleMemory;
        this._untrackedModules.push(moduleLink.moduleURL);
        return Result.ok(moduleLink);
    }
    async putModules(params) {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks = [];
        if ("records" in params) {
            const importedRecords = params;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`);
                }
                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(params.moduleCategory, moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
                this._untrackedModules.push(moduleLink.moduleURL);
            }
        }
        else if ("module" in params) {
            const singleRecord = params;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`);
            }
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(params.moduleCategory, moduleLink, singleRecord.module);
            this._untrackedModules.push(moduleLink.moduleURL);
            moduleLinks.push(moduleLink);
        }
        else {
            return Result.fail(`Missing records and importModules properties`, `Pass the correct data`);
        }
        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    }
    watchModules = (autoImporter) => {
        this._autoImporter = autoImporter;
    };
    _autoPut = async (moduleCategory) => {
        if (this._autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this._autoImporter();
        const putResult = await this.putModules({ ...imported, moduleCategory });
        if (putResult.isFailure) {
            return Result.fail(`this.putModules(): ${putResult.errorTitle}`, putResult.errorDescription);
        }
        return Result.ok(putResult.getValue());
    };
    getModule(moduleLink) {
        if (typeof moduleLink === "string") {
            return Result.fail(`${this.moduleLink.moduleURL} accepts module links only`, `Please pass the absolute path`);
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this.moduleLink.moduleURL], `this.isModuleExist()`, `The link: ${moduleLink}`);
        }
        let module = this._moduleMemories[moduleLink.moduleURL];
        return Result.ok(module);
    }
    getModules(moduleCategory) {
        const moduleMemories = [];
        for (let moduleMemory of this.moduleMemories) {
            if (moduleCategory === undefined || moduleMemory.moduleCategory === moduleCategory) {
                moduleMemories.push(moduleMemory);
            }
        }
        return moduleMemories;
    }
    isModuleExist(moduleLink) {
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        if (this._moduleMemories[url] !== undefined) {
            return true;
        }
        return false;
    }
    getModuleContents(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.map((memory) => memory.content);
    }
    getNoContentModules(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.filter((memory) => (memory.content === undefined));
    }
    afterCreation() {
        this._untrackedModules = [];
        return OkResult.ok();
    }
    _trackModules = (rest) => {
        if (this._untrackedModules.length === 0) {
            return OkResult.ok();
        }
        let moduleURL;
        while (moduleURL = this._untrackedModules.shift()) {
            const posted = rest.post(`#${escapeId(this._moduleLink.moduleURL)}`, this._moduleMemories[moduleURL]);
            if (posted.isFailure) {
                return OkResult.fail(`rest.post(#extension, '${this._moduleLink.moduleURL}'): ${posted.errorTitle}`, posted.errorDescription);
            }
        }
        return OkResult.ok();
    };
}
