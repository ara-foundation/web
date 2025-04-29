import { type AutoImporter, type ExtensionInterface, type ImportedRecords } from "@ara-web/reflect";
import { EnumTraits } from "@ara-web/ts-enhancement/traits";
import { Debug } from "@ara-web/ts-enhancement/debug";
import { OkResult, Result } from "@ara-web/ts-enhancement/result";
import { type AraPage, type AraComponent } from "@ara-web/ts-enhancement/ontology";
import { ModuleMemory, ProjectMemory, type ModuleMemories } from "@ara-web/reflect/memory";
import { extractModuleCategory, ModuleCategory, ModulePartitioner } from "./module.js";
import { ModuleLink, type ModuleURL } from "@ara-web/reflect/module-link";
import { CodeLevel } from "./parts/code-level/CodeLevel.js";
import { FilePath } from "@ara-web/reflect/module";

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
     * 
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
        return "Astro Framework's pages, components parser";
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

    public async putPackage(_: ImportedRecords & { importClause: string; }): Promise<Result<ModuleLink>> {
        return Result.errorCode501([this.moduleLink.moduleURL], 'putPackage');
    }

    /**
     * Put the modules, the Astro Framework's Reflect will require the modules
     * to be in the `this.srcDir`.
     * @param importedRecords 
     * @returns 
     */
    public async putModules(importedRecords: ImportedRecords): Promise<Result<ModuleLink[]>> {
        const moduleLinks: ModuleLink[] = [];
        for (let filePath in importedRecords.records) {
            const moduleLink = await FilePath.getFileAbsolutePath(filePath, importedRecords.importingFilePath);
            if (!(await FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.moduleURL}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importingFilePath}' locates to a file`)
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
    
    /**
     * @param moduleLink absolute path or a path relative to the `this.rootDir`
     * @returns 
     */
    public getModule<T>(moduleLink: ModuleLink|string): Result<ModuleMemory<T>> {
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
    
    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);
    
        return moduleMemories.map((memory) => (memory.content as T))
    }
    
    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories = this.getModules<T>(moduleCategory);
    
        return moduleMemories.filter((memory) => (memory.content === undefined));
    }
    
    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    /**
     * Retreives the data of the data
     * @param moduleCategory 
     * @param projectMemory 
     * @returns 
     */
    public beforeGet? = async (moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> => {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(moduleCategory);
            if (result.isFailure) {
                return Result.fail(`this._autoPut('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription!);
            }
        }
        
        if (moduleCategory === ModuleCategory.Page) {
            const contents = await this.postPageContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription!)
            }
            return OkResult.ok()
        } else if (moduleCategory === ModuleCategory.Component) {
            const contents = await this.getComponents();
            if (contents.isFailure) {
                return Result.fail(`this.getComponents(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
        } else if (moduleCategory === ModuleCategory.Layout) {
            const contents = await this.getLayouts();
            if (contents.isFailure) {
                return Result.fail(`this.getLayouts(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
        }

        return OkResult.ok();
    }
    
    //****************************************************************
    // 
    // REST
    //
    //****************************************************************

    /**
     * Returns the all the components.
     * Components are not evaluated by internal structures.
     */
    private getComponents = async (): Promise<Result<AraComponent[]>> => {
        const modules = this.getModules<AraComponent>(ModuleCategory.Component);
        if (modules.length === 0) {
            return Result.ok([])
        }

        const components: AraComponent[] = [];

        for (let moduleMemory of modules) {
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content as AraComponent);
                continue;
            }

            // const component = await fileContentToComponent(moduleMemory)
            // if (component.isFailure) {
            //     return Result.fail(
            //         `fileContentToComponent(modulePath: '${moduleMemory.moduleLink}'): ${component.errorTitle}`,
            //         component.errorDescription!
            //     )
            // }
            // components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns the all the layout components
     */
    private getLayouts = async (): Promise<Result<AraComponent[]>> => {
        const modules = this.getModules<AraComponent>(ModuleCategory.Layout);
        if (modules.length === 0) {
            return Result.ok([])
        }

        const components: AraComponent[] = [];

        for (let moduleMemory of modules) {
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content as AraComponent);
                continue;
            }

            // const component = await fileContentToComponent(moduleMemory)
            // if (component.isFailure) {
            //     return Result.fail(
            //         `fileContentToComponent(modulePath: '${moduleMemory.moduleLink}'): ${component.errorTitle}`,
            //         component.errorDescription!
            //     )
            // }
            // components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @returns {Result<AraPage[]>}
     */
    private postPageContents = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = this.getNoContentModules<AraPage>(ModuleCategory.Page);
        // identify ui content
        // identify source code
        // identify the page
        Debug.log(`Fetch the no content modules:`)
        Debug.log(Object.keys(noContentModules))
        for (let moduleMemory of noContentModules) {
            const moduleParts = await ModulePartitioner.partition<AraPage>(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`UILevel.identifyModuleParts<Page>('${moduleMemory.moduleLink.moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleMemory.moduleLink.moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription!)
            }
            Debug.log(`TODO: '${moduleMemory.moduleLink.moduleURL}' make sure to generate the content of the web page`);
        }
        return OkResult.ok();
    }

    /**
     * Returns a page by it's path
     */
    getPageByUrl = async(url: string | undefined): Promise<AraPage|undefined> => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }

        // const pages = await this.getPages();

        // if (pages.isFailure) {
        //     return undefined;
        // }

        // for (const page of pages.getValue()) {
        //     const pageUrl = fileNameToUrl(page.fileName);
        //     if (url === pageUrl) {
        //         return page;
        //     }
        // }

        return undefined;
    }

}