import { ModuleMemory, ProjectMemory, FilePath, escapeId, } from "@ara-web/reflect";
import { ModuleLink, SDSService, Rest, } from "@ara-web/sds";
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
    reflectExtension = true;
    _rootDir;
    _moduleLink;
    _moduleMemories = {};
    _autoImporter;
    _untrackedModules = [];
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
    getModuleWithFileExtensions(moduleLink) {
        if (moduleLink.isPkgURL || FilePath.isFileExtensionExist(moduleLink.toFilePath)) {
            return [];
        }
        return EnumTraits.enumValues(FileExtension)
            .map((ext) => ModuleLink.newFileURL(moduleLink.toFilePath + ext));
    }
    get untrackedModuleAmount() {
        return this._untrackedModules.length;
    }
    get memoryOperatorId() {
        return this._rootDir;
    }
    get packageLink() {
        return this._rootDir;
    }
    get moduleLink() {
        return this._moduleLink;
    }
    get moduleMemories() {
        return Object.values(this._moduleMemories);
    }
    get moduleCategories() {
        return EnumTraits.enumValues(ModuleCategory);
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    get rootDir() {
        return this._rootDir.toFilePath;
    }
    get srcDir() {
        return FilePath.join([this._rootDir.toFilePath, 'src']);
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
                this._untrackedModules.push(moduleLink.moduleURL);
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
    afterCreation() {
        this._untrackedModules = [];
        return OkResult.ok();
    }
    _trackModules = (rest) => {
        if (this._untrackedModules.length === 0) {
            return OkResult.ok();
        }
        let moduleURL = this._untrackedModules.shift();
        while (moduleURL !== undefined) {
            const posted = rest.post(`#${escapeId(this._moduleLink.moduleURL)}`, this._moduleMemories[moduleURL]);
            if (posted.isFailure) {
                return OkResult.fail(`rest.post(#extension, '${this._moduleLink.moduleURL}'): ${posted.errorTitle}`, posted.errorDescription);
            }
            moduleURL = this._untrackedModules.shift();
        }
        return OkResult.ok();
    };
    /**************************************************
     *
     * Hooks
     *
     **************************************************/
    async beforePost(_selector, rest, data) {
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }
        const beforeUpdate = await this.beforeAny(rest, data.moduleCategory);
        if (beforeUpdate.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${beforeUpdate.errorTitle}`, beforeUpdate.errorDescription);
        }
        // When posting an astro module, register `Astro` global variable.
        // Astro modules are the files with the .astro extension.
        if (ModuleIdentifier.isAstroOntologicalCategory(data.moduleCategory)) {
            const builtInIdentified = await this.postBuiltInIdentifiers(data);
            if (builtInIdentified.isFailure) {
                return Result.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
            }
        }
        return OkResult.ok();
    }
    async afterPost(_selector, rest, data) {
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }
        const projectMemoryNode = rest.get('*');
        if (projectMemoryNode === null || !(projectMemoryNode.getElement() instanceof ProjectMemory)) {
            return Result.fail(`rest.get('*'): no elements or root is not a project memory`, `Please pass the correct project memory rest`);
        }
        const projectMemory = projectMemoryNode.getElement();
        if (ModuleIdentifier.isAstroOntologicalCategory(data.moduleCategory)) {
            const contents = await this.identifyContent(data, projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription);
            }
            return OkResult.ok();
        }
        else if (data.moduleCategory === ModuleCategory.Script) {
            const scriptsPosted = await this.identifyScriptContent(data, projectMemory);
            if (scriptsPosted.isFailure) {
                return Result.fail(`this.identifyScriptContent(): ${scriptsPosted.errorTitle}`, scriptsPosted.errorDescription);
            }
        }
        else {
            const assetsPosted = await this.identifyAssetContent(data, projectMemory);
            if (assetsPosted.isFailure) {
                return Result.fail(`this.identifyAssetContent(): ${assetsPosted.errorTitle}`, assetsPosted.errorDescription);
            }
        }
        return OkResult.ok();
    }
    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @param {ProjectMemory} projectMemory is used to identify the dependencies that page depends on.
     * @returns {Result<AraPage[]>}
     */
    identifyContent = async (moduleMemory, projectMemory) => {
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
                    const identifiedPage = await extension.afterPageLvlIdenfication(moduleMemory.moduleCategory, moduleMemory, projectMemory);
                    if (identifiedPage.isFailure) {
                        return Result.fail(`extension('${extension.packageLink.toString}').afterPageLvlIdentification(): ${identifiedPage.errorTitle}`, identifiedPage.errorDescription);
                    }
                    else {
                        moduleMemory.content = identifiedPage.getValue().content;
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
    identifyScriptContent = async (moduleMemory, projectMemory) => {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        if (moduleParts.isFailure) {
            return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
        }
        const extension = moduleParts.getValue().fileExtension;
        if (!ModuleIdentifier.isScript(extension)) {
            return OkResult.fail(`ModuleIdentifier.isScript('${extension}'): not a script`, `Please pass the .ts or .js files`);
        }
        const data = await ModuleIdentifier.identify(moduleParts.getValue(), moduleMemory, projectMemory);
        if (data.isFailure) {
            return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
        }
        moduleMemory.content = data.getValue();
        return OkResult.ok();
    };
    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns
     */
    identifyAssetContent = async (moduleMemory, projectMemory) => {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        if (moduleParts.isFailure) {
            return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription);
        }
        const extension = moduleParts.getValue().fileExtension;
        if (!ModuleIdentifier.isAsset(extension)) {
            return OkResult.fail(`ModuleIdentifier.isAsset('${extension}'): not a script`, `Please pass asset file`);
        }
        const data = await ModuleIdentifier.identify(moduleParts.getValue(), moduleMemory, projectMemory);
        if (data.isFailure) {
            return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription);
        }
        moduleMemory.content = data.getValue();
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
    /**
     * Responsbile with registering built in `Astro` in
     * the modules that ends with .astro file extension.
     * @param moduleMemory
     * @returns
     */
    postBuiltInIdentifiers = async (moduleMemory) => {
        const identifiers = await AstroBuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(moduleMemory);
        }
        let failedPostResult = OkResult.ok();
        identifiers.getValue().forEach((codePiece) => {
            if (failedPostResult.isSuccess) {
                failedPostResult = moduleMemory.rest.post('*', codePiece, {});
            }
        });
        if (failedPostResult.isFailure) {
            return Result.fail(`moduleMemory.rest.post(builtInIdentifiers): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
        }
        return Result.ok(moduleMemory);
    };
    /**
     * Before any request, we must import modules.
     * We must track the untracked modules.
     * @param rest
     * @param moduleCategory
     * @returns
     */
    async beforeAny(rest, moduleCategory) {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(moduleCategory);
            if (result.isFailure) {
                return OkResult.fail(`this._autoPut(): ${result.errorTitle}`, result.errorDescription);
            }
        }
        const tracked = this._trackModules(rest);
        if (tracked.isFailure) {
            return OkResult.fail(`this._trackModules(): ${tracked.errorTitle}`, tracked.errorDescription);
        }
        return OkResult.ok();
    }
}
