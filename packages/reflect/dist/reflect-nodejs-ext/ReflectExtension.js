import PathModule from "node:path";
import { EnumTraits, OkResult, Result, ModuleLink, } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory, BuiltInIdentifiers, FilePath } from "../index.js";
import { ModuleCategory } from "./module.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension {
    _moduleLink;
    _moduleMemories = {};
    _autoImporter;
    constructor() {
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", fileModuleLink);
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
    putPackage = async (importedRecords) => {
        for (let filePath in importedRecords.records) {
            const absPath = await FilePath.getFileAbsolutePath(filePath, importedRecords.importingFilePath);
            if (!(await FilePath.isFileExist(absPath))) {
                return Result.fail(`FilePath.isFileExist('${absPath.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importingFilePath}' locates to a file`);
            }
            let [possibleNamespaceOrName, name, ...subDirs] = importedRecords.importClause.split("/");
            const subPath = subDirs.length === 0 ? undefined : PathModule.join(...subDirs);
            name = name === undefined || name.length === 0 ? possibleNamespaceOrName : name;
            const namespace = possibleNamespaceOrName === name ? undefined : possibleNamespaceOrName;
            const moduleLink = ModuleLink.newPackageURL(namespace, name, absPath, subPath);
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
            return Result.ok(moduleLink);
        }
        return Result.fail(`No record to put in`, `Please pass the correct node`);
    };
    putModules = async (importedRecords) => {
        const moduleLinks = [];
        for (let filePath in importedRecords.records) {
            const moduleLink = await FilePath.getFileAbsolutePath(filePath, importedRecords.importingFilePath);
            if (!(await FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importingFilePath}' locates to a file`);
            }
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
            moduleLinks.push(moduleLink);
        }
        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    };
    watchModules = async (autoImporter) => {
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
        return Result.ok(this._moduleMemories[moduleLink.moduleURL]);
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
        return this._moduleMemories[url] !== undefined;
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
        const moduleMemories = projectMemory.getModules();
        for (let module of moduleMemories) {
            if (module.moduleCategory === ModuleCategory.NodeJsModule) {
                continue;
            }
            module.addIdentifiers(identifiers.getValue());
        }
        return Result.ok(projectMemory);
    };
}
