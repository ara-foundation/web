import { Debug, Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { fileNameToUrl, ModuleType } from "./module.js";
import { ModuleMemory } from "./memory/ModuleMemory.js";
import { type UiContent } from "./ui-level/ui-content.js";
import { fileContentToComponent } from "./component.js";
import { globToUiContent } from "./ui-level/ui-content.js";
import { identifyComponents, uiContentToPage } from "./ui-level/page-level.js";
import { Code } from "./code-level/Code.js";
import { ProjectMemory } from "./memory/ProjectMemory.js";
import { AstNode, AstNodeType, type AstNodeValidater } from "./code-level/ast-node.js";

type PageTraits = {
    page: Page,
    uiContent?: UiContent,
    code?: Code,
}

type AllPageTraits = {[key: string]: PageTraits};

export type ModuleGlobs = {
    [key: string]: {                // Module path
        glob: unknown,
    }
}

export type CategorizedModuleGlobs = {
    [key in ModuleType]?: ModuleGlobs
}


/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect {
    // Category => Path => ModuleMemory Instance
    private _memory: ProjectMemory;
    private _autoImportFunc?: () => CategorizedModuleGlobs;

    constructor() {
        this._memory = new ProjectMemory();
    }

    //****************************************************************
    // 
    // Globs 
    // The globs are the files retreived by the `glob pattern`.
    // In Astro, these glob files are retreived by Vite's `import.meta.glob()`
    //
    //****************************************************************

    /**
     * Put the glob files into the reflect memory.
     * If the moduleGlobs are not given, then it will dynamically load the
     * globs when other public function are inserted.
     * @param {CategorizedModuleGlobs?} moduleGlobs optional.
     * @notice To enable auto import, simply call the this.putAutoGlobImport(funcReference)
     */
    public putGlobs = (moduleGlobs?: CategorizedModuleGlobs): Result<undefined> => {
        if (moduleGlobs === undefined) {
            if (this._autoImportFunc === undefined) {
                return Result.ok();
            }
        
            moduleGlobs = this._autoImportFunc();
            if (moduleGlobs === undefined) {
                return Result.ok();
            }
        }

        for (let moduleCategory in moduleGlobs) {
            let moduleType = moduleCategory as ModuleType;

            const categoryModules = moduleGlobs[moduleCategory as ModuleType];
            if (categoryModules === undefined) {
                continue;
            }

            for (let modulePath in categoryModules) {
                const glob = categoryModules[modulePath].glob;
                if (moduleType === ModuleType.Component || moduleType === ModuleType.Layout) {
                    const moduleMemory = new ModuleMemory<Component>(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                } else if (moduleType === ModuleType.Page) {
                    const moduleMemory = new ModuleMemory<Page>(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                } else if (moduleType === ModuleType.NodeJsModule) {
                    const moduleMemory = new ModuleMemory<unknown>(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                } else if (moduleType === ModuleType.Script) {
                    const moduleMemory = new ModuleMemory<unknown>(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                } else {
                    return Result.fail(
                        `The module '${modulePath}' of '${moduleType}' type is not supported by Reflect, update putGlobs()`
                    )
                }
            }

            // Delete the orphans
            const modulePaths = Object.keys(categoryModules);
            this._memory.cleanMemoryExcept(moduleType, modulePaths);
        }

        return Result.ok();
    }

    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc 
     */
    public putAutoGlobImporter = (importFunc?: (() => CategorizedModuleGlobs)) => {
        this._autoImportFunc = importFunc;
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
    public getComponents = async (): Promise<Result<Component[]>> => {
        this.putGlobs();

        const modules = this._memory.getModuleMemories<Component>(ModuleType.Component);
        if (modules === undefined) {
            return Result.ok([])
        }

        const components: Component[] = [];

        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content);
                continue;
            }

            const component = await fileContentToComponent(moduleMemory)
            if (component.isFailure) {
                return Result.fail(
                    `fileContentToComponent(modulePath: '${moduleMemory.modulePath}'): ${component.errorTitle}`,
                    component.errorDescription!
                )
            }
            this._memory.putModuleContent<Component>(ModuleType.Component, modulePath, component.getValue());
            components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns the all the layout components
     */
    public getLayouts = async (): Promise<Result<Component[]>> => {
        this.putGlobs();

        const modules = this._memory.getModuleMemories<Component>(ModuleType.Layout);
        if (modules === undefined) {
            return Result.ok([])
        }

        const components: Component[] = [];

        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content);
                continue;
            }

            const component = await fileContentToComponent(moduleMemory)
            if (component.isFailure) {
                return Result.fail(
                    `fileContentToComponent(modulePath: '${moduleMemory.modulePath}'): ${component.errorTitle}`,
                    component.errorDescription!
                )
            }
            this._memory.putModuleContent<Component>(ModuleType.Layout, modulePath, component.getValue());
            components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns all the pages
     * @returns {Result<Page[]>}
     */
    public getPages = async (): Promise<Result<Page[]>> => {
        this.putGlobs();

        const pageModules = this._memory.getModuleMemories<Page>(ModuleType.Page);
        if (pageModules === undefined) {
            return Result.ok([])
        }

        const pageTraits = await this.getPageTraits(pageModules)
        if (pageTraits.isFailure) {
            return Result.fail(
                `this.getPageTraits(): ${pageTraits.errorTitle}`,
                pageTraits.errorDescription!
            )
        }

        //---------------------------------------------------------------
        //
        // The identified Imports
        //
        //---------------------------------------------------------------
        

        const importsIdentifed = await this.identifyImports(pageTraits.getValue(), pageModules);
        if (importsIdentifed.isFailure) {
            return Result.fail(
                `this.identifyImports(): ${importsIdentifed.errorTitle}`,
                importsIdentifed.errorDescription!
            )
        } else {
            this._memory.putModuleMemories(ModuleType.Page, pageModules);
        }

        // let count = 0;
        // Debug.push("Identified nodes:")
        // for (let moduleType in this._memory.memories) {
        //     const modules = this._memory.memories[moduleType as ModuleType];
        //     for (let modulePath in modules) {
        //         let identifiers = modules[modulePath].getIdentifiers();
        //         for (let identifier in identifiers) {
        //             count++;
        //             Debug.log(`${count}): Module Type '${moduleType}', \n\t'${modulePath}' -> '${identifier}' node identified`)
        //             Debug.log(identifiers[identifier])
        //         }
        //     }
        // }
        // Debug.pop();
        
        //---------------------------------------------------------------
        //
        // The type declarations
        //
        //---------------------------------------------------------------
        
        // const identifiedTypes = await this.identifyTypes<Page>(ModuleType.Page, pageTraits.getValue(), pageModules);
        // if (identifiedTypes.isFailure) {
        //     return Result.fail(
        //         `this.identifyTypes(): ${identifiedTypes.errorTitle}`,
        //         identifiedTypes.errorDescription!
        //     )
        // } else {
        //     this._memory.putModuleMemories(ModuleType.Page, pageModules);
        // }

        // Debug.log(`All Pages types were declared.`);
        

        // Debug.push("All type declarations within the page:")
        // count = 0;
        // for (let moduleType in this._memory.memories) {
        //     if (moduleType !== ModuleType.Page) 
        //         continue;
        //     const modules = this._memory.memories[moduleType as ModuleType];
        //     for (let modulePath in modules) {
        //         Debug.log(`Get type declarations from memory of Page: ${modulePath}`);
        //         let identifiers = modules[modulePath].getIdentifiers([AstNode.isTypeDeclaration, AstNode.isDefinedInLocal]);
        //         Debug.log(`Page ${modulePath} has ${Object.keys(identifiers).length} local node definition`);
                
        //         for (let identifier in identifiers) {
        //             count++;
        //             Debug.log(`Identifier ${count}): Module Type '${moduleType}', \n\t'${modulePath}' -> '${identifier}' declared type:`)
        //             Debug.log(identifiers[identifier])
        //         }
        //     }
        // }
        // Debug.pop()

        //---------------------------------------------------------------
        //
        // The Linted import identifiers
        //
        //---------------------------------------------------------------
        
        // // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        // const importsLinted = await this.lintImports<Page>(ModuleType.Page, pageTraits.getValue());
        // // Debug.pop()
        // if (importsLinted.isFailure) {
        //     return Result.fail(
        //         `this.importsLinted(): ${importsLinted.errorTitle}`,
        //         importsLinted.errorDescription!
        //     )
        // }

        // Debug.push("Linted import identifiers:")
        // count = 0;
        // for (let moduleType in this._memory.memories) {
        //     const modules = this._memory.memories[moduleType as ModuleType];
        //     for (let modulePath in modules) {
        //         let identifiers = modules[modulePath].getIdentifiers();
        //         for (let identifier in identifiers) {
        //             count++;
        //             Debug.log(`${count}): Module Type '${moduleType}', \n\t'${modulePath}' -> '${identifier}' linted:`)
        //             Debug.log(identifiers[identifier])
        //         }
        //     }
        // }
        // Debug.pop()

        //---------------------------------------------------------------
        //
        // The Linted locally defined types
        //
        //---------------------------------------------------------------
        
        // // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        // const typesLinted = await this.lintTypes<Page>(ModuleType.Page, pageTraits.getValue());
        // // Debug.pop()
        // if (typesLinted.isFailure) {
        //     return Result.fail(
        //         `this.typesLinted(): ${typesLinted.errorTitle}`,
        //         typesLinted.errorDescription!
        //     )
        // }
        
        /**
         * Identify the elements by converting them into the Components of the web page.
         * But identified components may have the dynamic attributes, how do we make sure
         * they are evaluated?
         */
        // Identify the components.
        // TODO: make it part of previous code, by skipping
        // the dynamic data part.
        // for (let modulePath in contents) {
        //     // It's from the cache.
        //     if (contents[modulePath].uiContent === undefined) {
        //         continue;
        //     }

        //     const identificationResult = await identifyComponents(contents[modulePath].page, contents[modulePath].uiContent, contents[modulePath].code!);
        //     if (identificationResult.isFailure) {
        //         return Result.fail(
        //                 `identifyComponents: ${identificationResult.errorTitle}`,
        //                 identificationResult.errorDescription!,
        //         )
        //     } else {
        //         this._modules[ModuleType.Page]![modulePath].content = identificationResult.getValue();
        //         contents.push(identificationResult.getValue())
        //     }
        // }

        const pages = Object.keys(pageTraits.getValue()).map((modulePath) => (pageTraits.getValue()[modulePath].page))
        return Result.ok(pages);

        // // Lint the component's dynamic values
        // for (let modulePath in contents) {
        //     // It's from the cache.
        //     if (contents[modulePath].uiContent === undefined) {
        //         continue;
        //     }
        // }

        // const pages = Object.keys(contents).map((modulePath) => (contents[modulePath].page))

        // return Result.ok(pages);
    }

    /**
     * Returns a page by it's path
     */
    getPageByUrl = async(url: string | undefined): Promise<Page|undefined> => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }

        const pages = await this.getPages();

        if (pages.isFailure) {
            return undefined;
        }

        for (const page of pages.getValue()) {
            const pageUrl = fileNameToUrl(page.fileName);
            if (url === pageUrl) {
                return page;
            }
        }

        return undefined;
    }

    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */

    private getPageTraits = async (modules: {[key: string]: ModuleMemory<Page>}): Promise<Result<AllPageTraits>>  => {
        const contents: AllPageTraits = {}

        //
        // Validate the modules as valid content, then extract their data.
        //
        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];

            contents[modulePath] = {page: {} as Page}

            if (moduleMemory.content !== undefined) {
                contents[modulePath].page = (moduleMemory.content as Page)
                contents[modulePath].uiContent = undefined;
                continue;
            }

            const uiContent = await globToUiContent(moduleMemory.modulePath, moduleMemory.glob);
            if (uiContent.isFailure) {
                return Result.fail(
                    `globToUiContent(modulePath: '${moduleMemory.modulePath}'): ${uiContent.errorTitle}`,
                    uiContent.errorDescription!
                )
            }

            const page = uiContentToPage(uiContent.getValue());
            if (page.isFailure) {
                return Result.fail(
                    `PageTraits.fromFileContent: ${page.errorTitle}`,
                    page.errorDescription!,
                )
            }

            contents[modulePath].page = page.getValue()
            contents[modulePath].uiContent = uiContent.getValue()
        }

        return Result.ok(contents);
    }

    //
    // Import all data
    //
    private identifyImports = async (pageTraits: AllPageTraits, pageMemories: {[key: string]: ModuleMemory<Page>}): Promise<Result<undefined>> => {
        for (let modulePath in pageTraits) {
            // It's from the cache.
            if (pageTraits[modulePath].uiContent === undefined) {
                continue;
            }

            pageTraits[modulePath].code = new Code(pageTraits[modulePath].uiContent!.source!)
            
            // Debug.push(`code.getImportedIdentifiers()`, {memory: modulePath})
            const importIdentifiers = pageTraits[modulePath].code.getImportedIdentifiers();
            // Debug.pop();
            if (importIdentifiers.isFailure) {
                return Result.fail(
                    `code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`,
                    importIdentifiers.errorDescription!
                )
            }
           

            const importIdentifiersCount = Object.keys(importIdentifiers.getValue()).length;
            if (importIdentifiersCount > 0) {
                Debug.log(`Import Identifiers in reflect ${modulePath} has ${importIdentifiersCount}:`)
                Debug.log(importIdentifiers)
                pageMemories[modulePath].addIdentifiers(importIdentifiers.getValue());
            } else {
                Debug.log(`0 imports were identified :( for ${modulePath} page`);
            }
        }

        return Result.ok();
    }
    
    private lintTypes = async <T>(contentModuleType: ModuleType, contents: AllPageTraits): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            } else if (contents[modulePath].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory<T>(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`
                )
            }

            Debug.push(`code.getLintedTypeIdentifiers()`, {moduleMemory: modulePath})
            const depsIdentified = await contents[modulePath].code.getLintedTypeIdentifiers<T>(memory, this._memory)
            Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(
                    `code.getLintedImportIdentifiers(modulePath: '${modulePath}'): ${depsIdentified.errorTitle}`,
                    depsIdentified.errorDescription!
                )
            }

            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.addIdentifiers(depsIdentified.getValue());
            }
        }

        return Result.ok();
    }

    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    private lintImports = async <T>(contentModuleType: ModuleType, contents: AllPageTraits): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            } else if (contents[modulePath].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory<T>(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`
                )
            }

            // Debug.push(`code.getLintedImportIdentifiers()`, {memory: modulePath})
            const depsIdentified = await contents[modulePath].code.getLintedImportIdentifiers<T>(memory, this._memory)
            // Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(
                    `code.getLintedImportIdentifiers(modulePath: '${modulePath}'): ${depsIdentified.errorTitle}`,
                    depsIdentified.errorDescription!
                )
            }

            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.addIdentifiers(depsIdentified.getValue());
            }
        }

        return Result.ok();
    }

    private identifyTypes = async <T>(contentModuleType: ModuleType, contents: AllPageTraits, pageMemories: {[key: string]: ModuleMemory<Page>}): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            // It's from the cache.
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            } else if (contents[modulePath].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory<T>(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`
                )
            }

            // Debug.push(`code.getTypeIdentifiers()`, {memory: modulePath})
            const identifiers = contents[modulePath].code.getTypeIdentifiers(memory);
            // Debug.pop();
            if (identifiers.isFailure) {
                return Result.fail(
                    `code.getTypeIdentifiers(): ${identifiers.errorTitle}`,
                    identifiers.errorDescription!
                )
            }
            
            const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
            // Debug.log(`Identified '${importIdentifiersCount}' amount of type declarations, check that they are AstNode.Type`);
            if (importIdentifiersCount > 0) {
                // Debug.log(`The identified types:`)
                // for (let identifier in identifiers.getValue()) {
                    // Debug.log(((identifiers.getValue()[identifier]) as AstNode))
                // }
                pageMemories[modulePath].addIdentifiers(identifiers.getValue());
            }
        }

        return Result.ok();
    }

}