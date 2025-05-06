import { EnumTraits, OkResult, Result, ModuleLink, } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory, BuiltInIdentifiers, FilePath } from "../index.js";
import { ModuleCategory } from "./module.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension {
    _moduleLink;
    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    _moduleMemories = {};
    _autoImporter;
    constructor() {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", fileModuleLink);
    }
    getModuleWithFileExtensions(_) {
        return [];
    }
    get operatorId() {
        return this.moduleLink;
    }
    get moduleLink() {
        return this._moduleLink;
    }
    get moduleMemories() {
        return Object.values(this._moduleMemories);
    }
    get description() {
        return "Adds support of the Nodejs built in functions and context access";
    }
    putPackage = async ({ importModuleClause, module }) => {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, module);
        this._moduleMemories[moduleLink.moduleURL] = moduleMemory;
        return Result.ok(moduleLink);
    };
    putModules = async (params) => {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks = [];
        if ("records" in params) {
            const importedRecords = params;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`);
                }
                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
            }
        }
        else if ("module" in params) {
            const singleRecord = params;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`);
            }
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, singleRecord.module);
            moduleLinks.push(moduleLink);
        }
        else {
            return Result.fail(`Missing records and importModules properties`, `Pass the correct data`);
        }
        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    };
    watchModules = (autoImporter) => {
        this._autoImporter = autoImporter;
    };
    _autoPut = async (_) => {
        if (this._autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this._autoImporter();
        const putResult = await this.putModules(imported);
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
    get moduleCategories() {
        return EnumTraits.enumValues(ModuleCategory);
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    /**
     * NodeJs Extension's hook before the get operation will put the built in Nodejs built in identifiers
     * into all modules
     * @param projectMemory
     * @returns
     */
    async beforeGet(moduleCategory, projectMemory) {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(moduleCategory);
            if (result.isFailure) {
                return Result.fail(`this._autoPut('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription);
            }
        }
        const builtInIdentified = await this.postBuiltInIdentifiers(projectMemory);
        if (builtInIdentified.isFailure) {
            return Result.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
        }
        if (moduleCategory === ModuleCategory.NodeJsModule) {
            this.postNodeJSContents();
        }
        return OkResult.ok();
    }
    getModuleContents(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.map((memory) => memory.content);
    }
    getNoContentModules(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.filter((memory) => (memory.content === undefined));
    }
    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************
    postNodeJSContents = () => {
        const modules = this.getNoContentModules(ModuleCategory.NodeJsModule);
        for (let module of modules) {
            module.content = module.glob;
        }
    };
    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    // Except for the NodeJS extension itself.
    //
    postBuiltInIdentifiers = async (projectMemory) => {
        const identifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(projectMemory);
        }
        projectMemory
            .getModules()
            .filter((module) => module.moduleCategory !== ModuleCategory.NodeJsModule).forEach((module) => { module.addIdentifiers(identifiers.getValue()); });
        return Result.ok(projectMemory);
    };
}
