import { 
    type AutoImporter, 
    type ExtensionInterface, 
    type ImportedRecords,
    ModuleMemory, 
    ProjectMemory, 
    type ModuleMemories,
    FilePath,
    type SingleRecord
} from "@ara-web/reflect";
import { OkResult, Result, EnumTraits, ModuleLink, type ModuleURL } from "@ara-web/p-hintjens";
import {
    type Asset, type Page, type Module,
    FileExtension
} from "./ontology/index.js"
import {
    CodeLevel
} from "./code-level/index.js"
import {
    PageLevel
} from "./page-level/index.js"
import {
    extractModuleCategory,
    ModuleCategory, 
    ModuleIdentifier, 
    ModulePartitioner,
} from "./module.js"

/**
 * ReflectExtension adds Astro Framework support.
 */
export class ReflectAstroFramework implements ExtensionInterface {
    private _rootDir: ModuleLink;
    private _moduleLink: ModuleLink;
    private _moduleMemories: ModuleMemories<unknown> = {};
    private _autoImporter?: AutoImporter;
    
    /**
     * The *rootDir* must be absolute absolute path. Example:
     * 
     * ```
     * const rootDir = FilePath.getAbsolutePath('./test-app', import.meta.filename);
     * const astroReflect = new ReflectAstroFramework(FilePath.getAbsolutePath())
     * ```
     * @param rootDir 
     */
    constructor(rootDir?: ModuleLink) {
        if (rootDir !== undefined) {
            if (!FilePath.isAbsolutePath(rootDir.toFilePath)) {
                throw `rootDir must be absolute, '${rootDir}' not absolute, perhaps use FilePath.getAbsolutePath(rootDir, moduleThatCalls)`
            }
            this._rootDir = rootDir;
        } else {
            this._rootDir = ModuleLink.newFileURL(FilePath.getCurrentWorkingDir());
        }
        const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
        this._moduleLink = ModuleLink.newPackageURL("@ara-web", "reflect-astro-ext", fileModuleLink)
    }

    public getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[] {
        if (moduleLink.isPkgURL || FilePath.isFileExtensionExist(moduleLink.toFilePath)) {
            return [];
        }
        
        return EnumTraits.enumValues(FileExtension)
            .map(
                (ext) => ModuleLink.newFileURL(moduleLink.toFilePath + ext)
            );
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
        return "Astro Framework's pages, components reflection";
    }

    public get moduleCategories(): string[] {
        return EnumTraits.enumValues(ModuleCategory);
    }

    public get rootDir(): string {
        return this._rootDir.toFilePath;
    }

    public get srcDir(): string {
        return FilePath.join([this._rootDir.toFilePath, 'src']);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async putPackage(_: SingleRecord): Promise<Result<ModuleLink>> {
        return Result.errorCode501([this.moduleLink.moduleURL], 'putPackage');
    }

    /**
     * Put the modules, the Astro Framework's Reflect will require the modules
     * to be in the `this.srcDir`.
     * @param importedRecords 
     * @returns 
     */
    public async putModules(params: ImportedRecords|SingleRecord): Promise<Result<ModuleLink[]>> {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : this.rootDir;
        const moduleLinks: ModuleLink[] = [];
        if ("records" in params) {
            const importedRecords = params as ImportedRecords;
            for (const filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`)
                }

                const category = extractModuleCategory(this.srcDir, moduleLink.toFilePath);
                if (category.isFailure) {
                    return Result.fail(
                        `this.extractModuleCategory('${moduleLink.toFilePath}'): ${category.errorTitle}`,
                        category.errorDescription!
                    )
                }
                this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory<unknown>(category.getValue(), moduleLink, importedRecords.records[filePath]);
                moduleLinks.push(moduleLink);
            }
        } else if ("module" in params) {
            const singleRecord = params as SingleRecord;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`)
            }

            const category = extractModuleCategory(this.srcDir, moduleLink.toFilePath);
                if (category.isFailure) {
                    return Result.fail(
                        `this.extractModuleCategory('${moduleLink.toFilePath}'): ${category.errorTitle}`,
                        category.errorDescription!
                )
            }

            this._moduleMemories[moduleLink.moduleURL] = new ModuleMemory<unknown>(category.getValue(), moduleLink, singleRecord.module);
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
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    
    /**
     * @param moduleLink absolute path or a path relative to the `this.rootDir`
     * @returns 
     */
    public getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>> {
        if (typeof moduleLink === "string") {
            moduleLink = ModuleLink.newFileURL(FilePath.join([this.rootDir, moduleLink]));
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this.moduleLink.moduleURL], `this.isModuleExist()`, `The link: ${moduleLink}`)
        }
        return Result.ok(this._moduleMemories[moduleLink.moduleURL] as ModuleMemory<T>);
    }
    
    public getModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories: ModuleMemory<T>[] = [];
        for (const moduleMemory of this.moduleMemories) {
            if (moduleCategory === undefined || moduleMemory.moduleCategory === moduleCategory) {
                moduleMemories.push(moduleMemory as ModuleMemory<T>);
            }
        }
        return moduleMemories;
    }
    
    public isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean {
        const url = typeof moduleLink === "string" ? moduleLink : moduleLink.moduleURL;
        return this._moduleMemories[url] !== undefined;
    }
    
    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);
    
        return moduleMemories.map((memory) => (memory.content as T))
    }
    
    /**
     * Returns the modules whose content is undefined
     * @param moduleCategory 
     * @returns 
     */
    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories = this.getModules<T>(moduleCategory);
    
        return moduleMemories.filter((memory) => (memory.content === undefined));
    }
    
    public isSupportedModuleCategory(moduleCategory: string): boolean {
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
    public beforeGet? = async (moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> => {
        const result = await this._autoPut(moduleCategory);
        if (result.isFailure) {
            return Result.fail(`this._autoPut('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription!);
        }
        
        if (moduleCategory === ModuleCategory.Page) {
            const contents = await this.postPageContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription!)
            }
            return OkResult.ok()
        } else if (moduleCategory === ModuleCategory.Component) {
            const contents = await this.identifyComponentContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.identifyComponentContents(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
        } else if (moduleCategory === ModuleCategory.Layout) {
            const contents = await this.postLayoutContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postLayoutContents(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
        } else {
            const scriptsPosted = await this.postScripts(projectMemory);
            if (scriptsPosted.isFailure) {
                return Result.fail(`this.postScripts(): ${scriptsPosted.errorTitle}`, scriptsPosted.errorDescription!)
            }

            const assetsPosted = await this.postAssets(projectMemory);
            if (assetsPosted.isFailure) {
                return Result.fail(`this.postAssets(): ${assetsPosted.errorTitle}`, assetsPosted.errorDescription!)
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
    private identifyComponentContents = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules<Page>(ModuleCategory.Component);
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition<Page>(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription!)
            }

            const data = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`PageLevel.identify<Page>('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
            }

            moduleMemory.content = data.getValue();
        }
        
        return OkResult.ok();
    }

    /**
     * Identifies the data of the layout modules.
     * @param {ProjectMemory} projectMemory is used if the layout depends on another modules
     */
    private postLayoutContents = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules<Page>(ModuleCategory.Layout);
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition<Page>(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription!)
            }

            const data = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (data.isFailure) {
                return OkResult.fail(`PageLevel.identify<Page>('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
            }

            moduleMemory.content = data.getValue();
        }
        return OkResult.ok();
    }

    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @param {ProjectMemory} projectMemory is used to identify the dependencies that page depends on.
     * @returns {Result<AraPage[]>}
     */
    private postPageContents = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules<Page>(ModuleCategory.Page);
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition<Page>(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription!)
            }

            const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedMemory.getValue(), projectMemory);
            if (page.isFailure) {
                return OkResult.fail(`PageLevel.identify('${moduleMemory.moduleLink.moduleURL}'): ${page.errorTitle}`, page.errorDescription!)
            }

            moduleMemory.content = page.getValue();
        }
        return OkResult.ok();
    }

    /**
     * All modules whose file extensions are considered as script (typescript, javascript) are converted
     * into the `Script` ontological data.
     * @returns 
     */
    private postScripts = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules();
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const extension = moduleParts.getValue().fileExtension
            if (!ModuleIdentifier.isScript(extension)) {
                continue;
            }

            const data = await ModuleIdentifier.identify<Module>(moduleParts.getValue(), moduleMemory as ModuleMemory<Module>, projectMemory);

            if (data.isFailure) {
                return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
            }

            moduleMemory.content = data.getValue();
        }
        return OkResult.ok();
    }

    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns 
     */
    private postAssets = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules();
        for (const moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const extension = moduleParts.getValue().fileExtension
            if (!ModuleIdentifier.isAsset(extension)) {
                continue;
            }

            const data = await ModuleIdentifier.identify<Asset>(moduleParts.getValue(), moduleMemory as ModuleMemory<Asset>, projectMemory);

            if (data.isFailure) {
                return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
            }

            moduleMemory.content = data.getValue();
        }
        return OkResult.ok();
    }

    /**
     * Returns a page by it's path
     */
    public getPageByUrl = async(url: string | undefined): Promise<Page|undefined> => {
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
    }

}