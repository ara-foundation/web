import { ModuleMemory, ProjectMemory, FilePath, CodePiece, codePieceOps, } from "@ara-web/reflect";
import { ModuleLink, SDSService, ObjectNode } from "@ara-web/sds";
import { OkResult, Result, EnumTraits } from "@ara-web/p-hintjens";
import { FileExtension } from "./ontology/index.js";
import { CodeLevel } from "./code-level/index.js";
import { PageLevel } from "./page-level/index.js";
import { extractModuleCategory, ModuleCategory, ModuleIdentifier, ModulePartitioner, } from "./module.js";
import { AstroBuiltInIdentifiers } from "./astro-builtin-identifiers.js";
/**
 * ReflectExtension adds Astro Framework support.
 */
export class ReflectAstroExtension extends SDSService {
    _rootDir;
    _moduleLink;
    _moduleMemories = {};
    _autoImporter;
    /**
     * The *rootDir* must be absolute absolute path. Example:
     *
     * ```
     * const rootDir = FilePath.getAbsolutePath('./test-app', import.meta.filename);
     * const astroReflect = new ReflectAstroFramework(FilePath.getAbsolutePath())
     * ```
     * @param rootDir
     */
    constructor(rootDir, setup) {
        super({ ...setup, packageLink: ModuleLink.newPackageURL("@ara-web", "reflect-astro-ext") }, ["beforeGet", "afterGet"]);
        if (rootDir !== undefined) {
            if (!FilePath.isAbsolutePath(rootDir.toFilePath)) {
                throw `rootDir must be absolute, '${rootDir}' not absolute, perhaps use FilePath.getAbsolutePath(rootDir, moduleThatCalls)`;
            }
            this._rootDir = rootDir;
        }
        else {
            this._rootDir = ModuleLink.newFileURL(FilePath.getCurrentWorkingDir());
        }
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-astro-ext", fileModuleLink);
    }
    get memoryOperatorId() {
        return this._rootDir;
    }
    get packageLink() {
        return this._rootDir;
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
        return "Astro Framework's pages, components reflection";
    }
    get moduleCategories() {
        return EnumTraits.enumValues(ModuleCategory);
    }
    get rootDir() {
        return this._rootDir.toFilePath;
    }
    get srcDir() {
        return FilePath.join([this._rootDir.toFilePath, 'src']);
    }
    afterGet;
    getModuleWithFileExtensions(moduleLink) {
        if (moduleLink.isPkgURL || FilePath.isFileExtensionExist(moduleLink.toFilePath)) {
            return [];
        }
        return EnumTraits.enumValues(FileExtension)
            .map((ext) => ModuleLink.newFileURL(moduleLink.toFilePath + ext));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async putPackage(_) {
        return Result.errorCode501([this.moduleLink.moduleURL], 'putPackage');
    }
    /**
     * Put the modules, the Astro Framework's Reflect will require the modules
     * to be in the `this.srcDir`.
     * @param importedRecords
     * @returns
     */
    async putModules(params) {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : this.rootDir;
        const moduleLinks = [];
        if ("records" in params) {
            const importedRecords = params;
            for (const filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`);
                }
                const category = extractModuleCategory(this.srcDir, moduleLink.toFilePath);
                if (category.isFailure) {
                    return Result.fail(`this.extractModuleCategory('${moduleLink.toFilePath}'): ${category.errorTitle}`, category.errorDescription);
                }
                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(category.getValue(), moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
            }
        }
        else if ("module" in params) {
            const singleRecord = params;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`);
            }
            const category = extractModuleCategory(this.srcDir, moduleLink.toFilePath);
            if (category.isFailure) {
                return Result.fail(`this.extractModuleCategory('${moduleLink.toFilePath}'): ${category.errorTitle}`, category.errorDescription);
            }
            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory(category.getValue(), moduleLink, singleRecord.module);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    /**
     * @param moduleLink absolute path or a path relative to the `this.rootDir`
     * @returns
     */
    getModule(moduleLink) {
        if (typeof moduleLink === "string") {
            moduleLink = ModuleLink.newFileURL(FilePath.join([this.rootDir, moduleLink]));
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this.moduleLink.moduleURL], `this.isModuleExist()`, `The link: ${moduleLink}`);
        }
        return Result.ok(this._moduleMemories[moduleLink.moduleURL]);
    }
    getModules(moduleCategory) {
        const moduleMemories = [];
        for (const moduleMemory of this.moduleMemories) {
            if (moduleCategory === undefined || moduleMemory.moduleCategory === moduleCategory) {
                moduleMemories.push(moduleMemory);
            }
        }
        return moduleMemories;
    }
    isModuleExist(moduleLink) {
        const url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        return this._moduleMemories[url] !== undefined;
    }
    getModuleContents(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.map((memory) => memory.content);
    }
    /**
     * Returns the modules whose content is undefined
     * @param moduleCategory
     * @returns
     */
    getNoContentModules(moduleCategory) {
        const moduleMemories = this.getModules(moduleCategory);
        return moduleMemories.filter((memory) => (memory.content === undefined));
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    /**
     * Called by the `@ara-web/reflect` before fetching anything, so that Astro Framework
     * could convert the required module from file system for example, and convert that module
     * into the ontological data.
     * @param moduleCategory
     * @param projectMemory
     * @returns
     */
    async beforeGet(moduleCategory, projectMemory) {
        const result = await this._autoPut(moduleCategory);
        if (result.isFailure) {
            return Result.fail(`this._autoPut('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription);
        }
        if (ModuleIdentifier.isAstroGeneratedModuleCategory(moduleCategory)) {
            const builtInIdentified = await this.postBuiltInIdentifiers(projectMemory);
            if (builtInIdentified.isFailure) {
                return Result.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
            }
        }
        if (moduleCategory === ModuleCategory.Page) {
            const contents = await this.postPageContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription);
            }
            return OkResult.ok();
        }
        else if (moduleCategory === ModuleCategory.Component) {
            const contents = await this.identifyComponentContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.identifyComponentContents(): ${contents.errorTitle}`, contents.errorDescription);
            }
            return OkResult.ok();
        }
        else if (moduleCategory === ModuleCategory.Layout) {
            const contents = await this.postLayoutContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postLayoutContents(): ${contents.errorTitle}`, contents.errorDescription);
            }
            return OkResult.ok();
        }
        else {
            const scriptsPosted = await this.postScripts(projectMemory);
            if (scriptsPosted.isFailure) {
                return Result.fail(`this.postScripts(): ${scriptsPosted.errorTitle}`, scriptsPosted.errorDescription);
            }
            const assetsPosted = await this.postAssets(projectMemory);
            if (assetsPosted.isFailure) {
                return Result.fail(`this.postAssets(): ${assetsPosted.errorTitle}`, assetsPosted.errorDescription);
            }
        }
        return OkResult.ok();
    }
    //****************************************************************
    // 
    // REST
    //
    //****************************************************************
    /**
     * Identifies the data of the component modules.
     * @notice Components are not evaluated by internal structures.
     * @param {ProjectMemory} projectMemory is used if the layout depends on another modules
     */
    identifyComponentContents = async (projectMemory) => {
        const noContentModules = this.getNoContentModules(ModuleCategory.Component);
        for (const moduleIndex in noContentModules) {
            const moduleMemory = noContentModules[moduleIndex];
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
            }
            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription);
            }
            const data = await PageLevel.identify(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`PageLevel.identify<Page>('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
            }
            moduleMemory.content = data.getValue();
            if (this._extensions.length > 0) {
                for (const extension of this._extensions) {
                    if (extension.afterPageLvlIdenfication !== undefined) {
                        const identifiedPage = await extension.afterPageLvlIdenfication(ModuleCategory.Component, moduleMemory, projectMemory);
                        if (identifiedPage.isFailure) {
                            return Result.fail(`extension('${extension.packageLink.toString}').afterPageLvlIdentification(): ${identifiedPage.errorTitle}`, identifiedPage.errorDescription);
                        }
                        else {
                            noContentModules[moduleIndex] = identifiedPage.getValue();
                        }
                    }
                }
            }
        }
        return OkResult.ok();
    };
    /**
     * Identifies the data of the layout modules.
     * @param {ProjectMemory} projectMemory is used if the layout depends on another modules
     */
    postLayoutContents = async (projectMemory) => {
        const noContentModules = this.getNoContentModules(ModuleCategory.Layout);
        for (const moduleIndex in noContentModules) {
            const moduleMemory = noContentModules[moduleIndex];
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
            }
            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription);
            }
            const data = await PageLevel.identify(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`PageLevel.identify<Page>('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
            }
            moduleMemory.content = data.getValue();
            if (this._extensions.length > 0) {
                for (const extension of this._extensions) {
                    if (extension.afterPageLvlIdenfication !== undefined) {
                        const identifiedPage = await extension.afterPageLvlIdenfication(ModuleCategory.Layout, moduleMemory, projectMemory);
                        if (identifiedPage.isFailure) {
                            return Result.fail(`extension('${extension.packageLink.toString}').afterPageLvlIdentification(): ${identifiedPage.errorTitle}`, identifiedPage.errorDescription);
                        }
                        else {
                            noContentModules[moduleIndex] = identifiedPage.getValue();
                        }
                    }
                }
            }
        }
        return OkResult.ok();
    };
    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @param {ProjectMemory} projectMemory is used to identify the dependencies that page depends on.
     * @returns {Result<AraPage[]>}
     */
    postPageContents = async (projectMemory) => {
        const noContentModules = this.getNoContentModules(ModuleCategory.Page);
        for (const moduleIndex in noContentModules) {
            const moduleMemory = noContentModules[moduleIndex];
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
            }
            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription);
            }
            const page = await PageLevel.identify(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (page.isFailure) {
                return OkResult.fail(`PageLevel.identify('${moduleMemory.moduleLink.moduleURL}'): ${page.errorTitle}`, page.errorDescription);
            }
            moduleMemory.content = page.getValue();
            if (this._extensions.length > 0) {
                for (const extension of this._extensions) {
                    if (extension.afterPageLvlIdenfication !== undefined) {
                        const identifiedPage = await extension.afterPageLvlIdenfication(ModuleCategory.Page, moduleMemory, projectMemory);
                        if (identifiedPage.isFailure) {
                            return Result.fail(`extension('${extension.packageLink.toString}').afterPageLvlIdentification(): ${identifiedPage.errorTitle}`, identifiedPage.errorDescription);
                        }
                        else {
                            noContentModules[moduleIndex] = identifiedPage.getValue();
                        }
                    }
                }
            }
        }
        return OkResult.ok();
    };
    /**
     * All modules whose file extensions are considered as script (typescript, javascript) are converted
     * into the `Script` ontological data.
     * @returns
     */
    postScripts = async (projectMemory) => {
        const noContentModules = this.getNoContentModules();
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
            }
            const extension = moduleParts.getValue().fileExtension;
            if (!ModuleIdentifier.isScript(extension)) {
                continue;
            }
            const data = await ModuleIdentifier.identify(moduleParts.getValue(), moduleMemory, projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
            }
            moduleMemory.content = data.getValue();
        }
        return OkResult.ok();
    };
    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns
     */
    postAssets = async (projectMemory) => {
        const noContentModules = this.getNoContentModules();
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
            }
            const extension = moduleParts.getValue().fileExtension;
            if (!ModuleIdentifier.isAsset(extension)) {
                continue;
            }
            const data = await ModuleIdentifier.identify(moduleParts.getValue(), moduleMemory, projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
            }
            moduleMemory.content = data.getValue();
        }
        return OkResult.ok();
    };
    /**
     * Returns a page by it's path
     */
    getPageByUrl = async (url) => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }
        return undefined;
    };
    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    // Except for the NodeJS extension itself.
    //
    postBuiltInIdentifiers = async (projectMemory) => {
        const identifiers = await AstroBuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(projectMemory);
        }
        projectMemory
            .getModules()
            .filter((module) => ModuleIdentifier.isAstroGeneratedModule(module)).forEach((moduleMemory) => {
            let failedPostResult = OkResult.ok();
            const parent = moduleMemory.rest.get('*');
            identifiers.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode(codePieceOps, importedCodePiece, parent);
                const posted = moduleMemory.rest.post('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        });
        return Result.ok(projectMemory);
    };
}
