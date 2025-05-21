import { 
    type AutoImporter, 
    type ExtensionInterface, 
    type ImportedRecords,
    ModuleMemory, 
    ProjectMemory, 
    type ModuleMemories,
    FilePath,
    type SingleRecord,
    escapeId,
} from "@ara-web/reflect";
import { 
    ModuleLink, 
    type ModuleURL,
    SDSService, 
    type SDSExtensionInterface, 
    type SDSSetup,
    Rest,
} from "@ara-web/sds";
import { OkResult, Result, EnumTraits } from "@ara-web/p-hintjens";
import type { ReflectElementType } from "@ara-web/reflect";
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
import { AstroBuiltInIdentifiers } from "./astro-builtin-identifiers.js";

// Not ReflectExtensionInterface, since it's not an extension of Reflect.
// But on it's own available for the Astro Extension itself.
export interface AstroExtensionInterface extends SDSExtensionInterface {
    // Call this extension method after calling PageLevel.identify<>
    afterPageLvlIdenfication?(moduleCategory: string, module: ModuleMemory<Page>, projectMemory: ProjectMemory): Promise<Result<ModuleMemory<Page>>>;
}

/**
 * ReflectExtension adds Astro Framework support.
 */
export class ReflectAstroExtension extends SDSService<ReflectAstroExtension, AstroExtensionInterface> implements ExtensionInterface {
    public reflectExtension: boolean = true;
    private _rootDir: ModuleLink;
    private _moduleLink: ModuleLink;
    private _moduleMemories: ModuleMemories<unknown> = {};
    private _autoImporter?: AutoImporter;
    protected _untrackedModules: ModuleURL[] = [];

    /**
     * The *rootDir* must be absolute absolute path. Example:
     * 
     * ```
     * const rootDir = FilePath.getAbsolutePath('./test-app', import.meta.filename);
     * const astroReflect = new ReflectAstroFramework(FilePath.getAbsolutePath())
     * ```
     * @param rootDir 
     */
    constructor(rootDir?: ModuleLink, setup?: Omit<SDSSetup<AstroExtensionInterface>, "packageLink">) {
        super({...setup, packageLink: ModuleLink.newPackageURL("@ara-web", "reflect-astro-ext")}, ["beforeGet", "afterGet"])
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

    public get untrackedModuleAmount(): number {
        return this._untrackedModules.length;
    }

    public get memoryOperatorId(): ModuleLink {
        return this._rootDir
    }

    public get packageLink(): ModuleLink {
        return this._rootDir
    }

    public get moduleLink(): ModuleLink {
        return this._moduleLink;
    }

    public get moduleMemories(): ModuleMemory<unknown>[] {
        return Object.values(this._moduleMemories);
    }

    public get moduleCategories(): string[] {
        return EnumTraits.enumValues(ModuleCategory) as string[];
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
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
                this._untrackedModules.push(moduleLink.moduleURL);
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

    public afterCreation(): OkResult {
        this._untrackedModules = [];
        return OkResult.ok();
    }

    protected _trackModules = (rest: Rest<ReflectElementType>): OkResult => {
        if (this._untrackedModules.length === 0) {
            return OkResult.ok();
        }
        
        let moduleURL: ModuleURL | undefined = this._untrackedModules.shift();
        while (moduleURL !== undefined) {
            const posted = rest.post!(`#${escapeId(this._moduleLink.moduleURL)}`, this._moduleMemories[moduleURL]);
            if (posted.isFailure) {
                return OkResult.fail(`rest.post(#extension, '${this._moduleLink.moduleURL}'): ${posted.errorTitle}`, posted.errorDescription!);
            }
            moduleURL = this._untrackedModules.shift();
        }

        return OkResult.ok();
    }

    /**************************************************
     * 
     * Hooks
     * 
     **************************************************/

    public async beforePost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult> {
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }

        const beforeUpdate = await this.beforeAny(rest, data.moduleCategory);
        if (beforeUpdate.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${beforeUpdate.errorTitle}`, beforeUpdate.errorDescription!);
        }

        // When posting an astro module, register `Astro` global variable.
        // Astro modules are the files with the .astro extension.
        if (ModuleIdentifier.isAstroOntologicalCategory(data.moduleCategory)) {
            const builtInIdentified = await this.postBuiltInIdentifiers(data);
            if (builtInIdentified.isFailure) {
                return Result.fail(
                    `this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`,
                    builtInIdentified.errorDescription!
                )
            }
        }

        return OkResult.ok();
    }

    public async afterPost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult> {
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }

        const projectMemoryNode = rest.get!('*');
        if (projectMemoryNode === null || !(projectMemoryNode.getElement() instanceof ProjectMemory)) {
            return Result.fail(`rest.get('*'): no elements or root is not a project memory`, `Please pass the correct project memory rest`);
        }
        const projectMemory = projectMemoryNode.getElement()! as ProjectMemory;

        if (ModuleIdentifier.isAstroOntologicalCategory(data.moduleCategory)) {
            const contents = await this.identifyContent(data as ModuleMemory<Page>, projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription!)
            }
            return OkResult.ok()
        } else if (data.moduleCategory === ModuleCategory.Script) {
            const scriptsPosted = await this.identifyScriptContent(data as ModuleMemory<Module>, projectMemory);
            if (scriptsPosted.isFailure) {
                return Result.fail(`this.identifyScriptContent(): ${scriptsPosted.errorTitle}`, scriptsPosted.errorDescription!)
            }
        } else {
            const assetsPosted = await this.identifyAssetContent(data as ModuleMemory<Asset>, projectMemory);
            if (assetsPosted.isFailure) {
                return Result.fail(`this.identifyAssetContent(): ${assetsPosted.errorTitle}`, assetsPosted.errorDescription!)
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
    private identifyContent = async (moduleMemory: ModuleMemory<Page>, projectMemory: ProjectMemory): Promise<OkResult> => {
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
        if (this._extensions.length > 0) {
            for (const extension of this._extensions) {
                if (extension.afterPageLvlIdenfication !== undefined) {
                    const identifiedPage = await extension.afterPageLvlIdenfication(moduleMemory.moduleCategory, moduleMemory, projectMemory);
                    if (identifiedPage.isFailure) {
                        return Result.fail(`extension('${extension.packageLink.toString}').afterPageLvlIdentification(): ${identifiedPage.errorTitle}`, identifiedPage.errorDescription!)
                    } else {
                        moduleMemory.content = identifiedPage.getValue().content!;
                    }
                }
            }
        }
        return OkResult.ok();
    }

    /**
     * All modules whose file extensions are considered as script (typescript, javascript) are converted
     * into the `Script` ontological data.
     * @returns 
     */
    private identifyScriptContent = async(moduleMemory: ModuleMemory<Module>, projectMemory: ProjectMemory): Promise<OkResult> => {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        if (moduleParts.isFailure) {
            return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
        }

        const extension = moduleParts.getValue().fileExtension
        if (!ModuleIdentifier.isScript(extension)) {
            return OkResult.fail(`ModuleIdentifier.isScript('${extension}'): not a script`, `Please pass the .ts or .js files`);
        }

        const data = await ModuleIdentifier.identify(moduleParts.getValue(), moduleMemory as ModuleMemory<Module>, projectMemory);

        if (data.isFailure) {
            return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
        }

        moduleMemory.content = data.getValue();
        return OkResult.ok();
    }

    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns 
     */
    private identifyAssetContent = async (moduleMemory: ModuleMemory<Asset>, projectMemory: ProjectMemory): Promise<OkResult> => {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        if (moduleParts.isFailure) {
            return OkResult.fail(`ModulePartitioner.partition('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
        }

        const extension = moduleParts.getValue().fileExtension
        if (!ModuleIdentifier.isAsset(extension)) {
            return OkResult.fail(`ModuleIdentifier.isAsset('${extension}'): not a script`, `Please pass asset file`);
        }

        const data = await ModuleIdentifier.identify<Asset>(moduleParts.getValue(), moduleMemory as ModuleMemory<Asset>, projectMemory);

        if (data.isFailure) {
            return OkResult.fail(`ModuleIdentifier.identify('${moduleMemory.moduleLink.moduleURL}'): ${data.errorTitle}`, data.errorDescription!)
        }

        moduleMemory.content = data.getValue();
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

    /**
     * Responsbile with registering built in `Astro` in
     * the modules that ends with .astro file extension.
     * @param moduleMemory 
     * @returns 
     */
    private postBuiltInIdentifiers = async (moduleMemory: ModuleMemory<unknown>): Promise<Result<ModuleMemory<unknown>>> => {
        const identifiers = await AstroBuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(
                `getBuiltInIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(moduleMemory);
        }

        let failedPostResult = OkResult.ok();
        identifiers.getValue().forEach(
            (codePiece) => {
                if (failedPostResult.isSuccess) {
                    failedPostResult = moduleMemory.rest.post!('*', codePiece, {})
                }
            }
        )
        if (failedPostResult.isFailure) {
            return Result.fail(`moduleMemory.rest.post(builtInIdentifiers): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
        }
        return Result.ok(moduleMemory);
    }

    /**
     * Before any request, we must import modules.
     * We must track the untracked modules.
     * @param rest 
     * @param moduleCategory 
     * @returns 
     */
    private async beforeAny(rest: Rest<ReflectElementType>, moduleCategory: string): Promise<OkResult> {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(moduleCategory);
            if (result.isFailure) {
                return OkResult.fail(`this._autoPut(): ${result.errorTitle}`, result.errorDescription!);
            }
        }

        const tracked = this._trackModules(rest);
        if (tracked.isFailure) {
            return OkResult.fail(`this._trackModules(): ${tracked.errorTitle}`, tracked.errorDescription!);
        }

        return OkResult.ok();
    }

}