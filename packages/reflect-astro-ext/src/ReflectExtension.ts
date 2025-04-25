import { trimPath, type ExtensionInterface } from "@ara-web/reflect";
import { Debug, enumValues, OkResult, Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory, type ModuleMemories } from "@ara-web/reflect/memory";
import { type UiContent } from "./ui-level/ui-content.js";
import { fileContentToComponent } from "./component.js";
import { globToUiContent } from "./ui-level/ui-content.js";
import { uiContentToPage } from "./ui-level/page-level.js";
import { Code } from "@ara-web/reflect/code-level";
import { AstNode } from "@ara-web/reflect/code-level/ast-node";
import { IntersectedUnionType, UnionTypeDeclaration } from "@ara-web/reflect/code-level/ast-node@types";
import { ModuleCategory, modulePathToAllPossibleFileNames as modulePathToAllPossibleModulePaths } from "./module.js";
import { ModuleLink, type ModuleURL } from "../../reflect/src/ara-link/ReflectAraLink.js";
import type { PossibleModuleLinksBuilder } from "../../reflect/src/extension-interface.js";

type PageTraits = {
    page: Page,
    uiContent?: UiContent,
    code?: Code,
}

type AllPageTraits = {[key: ModuleURL]: PageTraits};

export type ReflectSetup = {
    extensions?: ExtensionInterface[],
}

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class ReflectExtension implements ExtensionInterface {
    constructor() {}
    
    public get name(): string {
        return "reflect-astro-ext";
    }

    public get namespace(): string {
        return "@ara-web";
    }

    public get label(): string {
        return "Astro Framework Reflection";
    }

    public get description(): string {
        return "Astro Framework's pages, components parser";
    }

    public get moduleCategories(): string[] {
        return enumValues(ModuleCategory);
    }

    public isSupportedModuleType(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    public getNewModuleMemory(moduleLink: ModuleLink, glob: unknown): Result<ModuleMemory<unknown>> {
        if (moduleLink.category === ModuleCategory.Layout) {
            return Result.ok(new ModuleMemory<Component>(moduleLink, glob));
        } else if (moduleLink.category === ModuleCategory.Component) {
            return Result.ok(new ModuleMemory<Component>(moduleLink, glob));
        } else if (moduleLink.category === ModuleCategory.Page) {
            return Result.ok(new ModuleMemory<Page>(moduleLink, glob));
        } else if (moduleLink.category === ModuleCategory.Script) {
            return Result.ok(new ModuleMemory<unknown>(moduleLink, glob));
        } 
        
        return Result.fail(
            `The module '${moduleLink.toString()}' not supported by Reflect`
        )
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    public getNewModuleLink(moduleCategory: string, filePath: string): Result<ModuleLink> {
        if (!this.isSupportedModuleCategory(moduleCategory)) {
            return Result.fail(`this.isSupportedModuleCategory('${moduleCategory}'): false`, `Please pass the correct module category`)
        }

        const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, filePath);
        return Result.ok(moduleLink);
    }

    /**
     * ModulePath is received from the 'import clauses' for example
     */
    public getPossibleModuleLinks: PossibleModuleLinksBuilder = (modulePath: string): ModuleLink[] => {
        modulePath = trimPath(modulePath);
        const moduleLinks: ModuleLink[] = [];
        const moduleCategories = this.moduleCategories;
        for (let moduleCategory of moduleCategories) {
            const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, modulePath)
            moduleLinks.push(moduleLink)

            const modulePaths = modulePathToAllPossibleModulePaths(modulePath);
            modulePaths.forEach(
                (possibleModulePath) => (
                    moduleLinks.push(
                        new ModuleLink(
                            this.namespace, 
                            this.name, 
                            moduleCategory, 
                            possibleModulePath
                        )
                    )
                )
            )
        }
        return moduleLinks;
    }

    /**
     * Retreives the data of the data
     * @param moduleCategory 
     * @param projectMemory 
     * @returns 
     */
    public beforeGet? = async (moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> => {
        if (moduleCategory === ModuleCategory.Page) {
            const contents = await this.getPages(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.getPages(): ${contents.errorTitle}`, contents.errorDescription!)
            }
            return OkResult.ok()
            // return Result.ok(contents.getValue() as T[]);
        } else if (moduleCategory === ModuleCategory.Component) {
            const contents = await this.getComponents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.getComponents(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
            // return Result.ok(contents.getValue() as T[]);
        } else if (moduleCategory === ModuleCategory.Layout) {
            const contents = await this.getLayouts(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.getLayouts(): ${contents.errorTitle}`, contents.errorDescription!)
            }

            return OkResult.ok()
            // return Result.ok(contents.getValue() as T[]);
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
    private getComponents = async (projectMemory: ProjectMemory): Promise<Result<Component[]>> => {
        const modules = projectMemory.getModuleMemories<Component>(ModuleCategory.Component);
        if (modules === undefined) {
            return Result.ok([])
        }

        const components: Component[] = [];

        for (let moduleURL in modules) {
            const moduleMemory = modules[moduleURL as ModuleURL];
            
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content as Component);
                continue;
            }

            const component = await fileContentToComponent(moduleMemory)
            if (component.isFailure) {
                return Result.fail(
                    `fileContentToComponent(modulePath: '${moduleMemory.moduleLink}'): ${component.errorTitle}`,
                    component.errorDescription!
                )
            }
            projectMemory.putModuleContent<Component>(moduleURL as ModuleURL, component.getValue());
            components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns the all the layout components
     */
    private getLayouts = async (projectMemory: ProjectMemory): Promise<Result<Component[]>> => {
        const modules = projectMemory.getModuleMemories<Component>(ModuleCategory.Layout) as ModuleMemories<Component>;
        if (modules === undefined) {
            return Result.ok([])
        }

        const components: Component[] = [];

        for (let moduleURL in modules) {
            const moduleMemory = modules[moduleURL as ModuleURL];
            
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content as Component);
                continue;
            }

            const component = await fileContentToComponent(moduleMemory)
            if (component.isFailure) {
                return Result.fail(
                    `fileContentToComponent(modulePath: '${moduleMemory.moduleLink}'): ${component.errorTitle}`,
                    component.errorDescription!
                )
            }
            projectMemory.putModuleContent<Component>(moduleURL as ModuleURL, component.getValue());
            components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns all the pages
     * @returns {Result<Page[]>}
     */
    private getPages = async (projectMemory: ProjectMemory): Promise<Result<Page[]>> => {
        const pageModules = projectMemory.getModuleMemories<Page>(ModuleCategory.Page);
        
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
        
        const importsIdentifed = await this.identifyImports(pageTraits.getValue(), pageModules, projectMemory);
        if (importsIdentifed.isFailure) {
            return Result.fail(
                `this.identifyImports(): ${importsIdentifed.errorTitle}`,
                importsIdentifed.errorDescription!
            )
        } else {
            projectMemory.putModuleMemories(pageModules);
        }

        // let count = 0;
        // Debug.push("Identified nodes")
        //     const modules = projectMemory.memories[ModuleType.Page];
        //     for (let modulePath in modules) {
        //         let identifiers = modules[modulePath].getIdentifiers();
        //         for (let identifier in identifiers) {
        //             count++;
        //             if (identifier !== "AraWebLayout") continue;
        //             Debug.log(`${count}): Module Type '${ModuleType.Page}', \n\t'${modulePath}' -> '${identifier}' node identified`)
        //             Debug.log(identifiers[identifier])
        //         }
        //     }
        // Debug.pop();
        
        //---------------------------------------------------------------
        //
        // The type declarations
        //
        //---------------------------------------------------------------
        
        const identifiedTypes = await this.identifyTypes<Page>(ModuleCategory.Page, pageTraits.getValue(), pageModules, projectMemory);
        if (identifiedTypes.isFailure) {
            return Result.fail(
                `this.identifyTypes(): ${identifiedTypes.errorTitle}`,
                identifiedTypes.errorDescription!
            )
        } else {
            projectMemory.putModuleMemories(pageModules);
        }

        Debug.log(`Types in all pages declared.`);

        // Debug.push("All type declarations within the page:")
        // let count = 0;
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
        
        // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        const importsLinted = await this.lintImports<Page>(ModuleCategory.Page, pageTraits.getValue(), projectMemory);
        // Debug.pop()
        if (importsLinted.isFailure) {
            return Result.fail(
                `this.importsLinted(): ${importsLinted.errorTitle}`,
                importsLinted.errorDescription!
            )
        }

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
        
        // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        const typesLinted = await this.lintTypes<Page>(ModuleCategory.Page, pageTraits.getValue(), projectMemory);
        // Debug.pop()
        if (typesLinted.isFailure) {
            return Result.fail(
                `this.typesLinted(): ${typesLinted.errorTitle}`,
                typesLinted.errorDescription!
            )
        }
        
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

        // TODO put into project memory
        const pages: Page[] = [];
        
        Object.keys(pageTraits.getValue()).forEach(
            (moduleURL) => {
                const content = pageTraits.getValue()[moduleURL as ModuleURL].page;
                pages.push(content);
                projectMemory.putModuleContent<Page>(moduleURL as ModuleURL, content);
            }
        )
        
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

    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */

    /**
     * Adds the AST Tree and UI Content
     * @param modules 
     * @returns 
     */
    private getPageTraits = async (modules: ModuleMemories<Page>): Promise<Result<AllPageTraits>>  => {
        const contents: AllPageTraits = {}

        //
        // Validate the modules as valid content, then extract their data.
        //
        for (let modulePath in modules) {
            const moduleURL = modulePath as ModuleURL;
            const moduleMemory = modules[moduleURL];

            contents[moduleURL] = {page: {} as Page}

            if (moduleMemory.content !== undefined) {
                contents[moduleURL].page = (moduleMemory.content as Page)
                contents[moduleURL].uiContent = undefined;
                continue;
            }

            const uiContent = await globToUiContent(moduleURL, moduleMemory.glob);
            if (uiContent.isFailure) {
                return Result.fail(
                    `globToUiContent(modulePath: '${moduleMemory.moduleLink}'): ${uiContent.errorTitle}`,
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

            contents[moduleURL].page = page.getValue()
            contents[moduleURL].uiContent = uiContent.getValue()
        }

        return Result.ok(contents);
    }

    //
    // Import all data
    //
    private identifyImports = async (pageTraits: AllPageTraits, pageMemories: ModuleMemories<Page>, projectMemory: ProjectMemory): Promise<Result<undefined>> => {
        for (let modulePath in pageTraits) {
            const moduleURL = modulePath as ModuleURL;
            // It's from the cache.
            if (pageTraits[moduleURL].uiContent === undefined) {
                continue;
            }

            pageTraits[moduleURL].code = new Code(pageTraits[moduleURL].uiContent!.source!)
            
            // Debug.push(`code.getImportedIdentifiers()`, {memory: modulePath})
            const importIdentifiers = pageTraits[moduleURL].code.getImportedIdentifiers(projectMemory);
            // Debug.pop();
            if (importIdentifiers.isFailure) {
                return Result.fail(
                    `code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`,
                    importIdentifiers.errorDescription!
                )
            }

            const importIdentifiersCount = Object.keys(importIdentifiers.getValue()).length;
            if (importIdentifiersCount > 0) {
                pageMemories[modulePath as ModuleURL].addIdentifiers(importIdentifiers.getValue());
            } else {
                Debug.log(`0 imports were identified :( for ${modulePath} page`);
            }
        }

        return Result.ok();
    }
    
    private lintTypes = async <T>(contentModuleCategory: ModuleCategory, contents: AllPageTraits, projectMemory: ProjectMemory): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            const moduleURL = modulePath as ModuleURL;
            // It's from the cache.
            if (contents[moduleURL].uiContent === undefined) {
                continue;
            } else if (contents[moduleURL].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = projectMemory.getModuleMemory<T>(moduleURL);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `projectMemory.getModuleMemory(moduleType: '${contentModuleCategory}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleCategory}' type`
                )
            }

            Debug.push(`code.getLintedTypeIdentifiers()`, {moduleMemory: modulePath})
            const depsIdentified = await contents[moduleURL].code.getLintedTypeIdentifiers<T>(memory.getValue(), projectMemory)
            Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(
                    `code.getLintedTypeIdentifiers(moduleURL: '${moduleURL}'): ${depsIdentified.errorTitle}`,
                    depsIdentified.errorDescription!
                )
            }
            
            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.getValue().addIdentifiers(depsIdentified.getValue());
            }

            Debug.log(`Linted data of '${modulePath}':`)
            const memoryIdentifiers = memory.getValue().getIdentifiers([AstNode.isTypeDeclaration]);
            for (let identifier in memoryIdentifiers) {
                const data = (memoryIdentifiers[identifier] as AstNode).data
                Debug.log(`The data of the '${identifier}' type:`);
                Debug.log(data);
                if (data instanceof IntersectedUnionType) {
                    Debug.log(`'${identifier}' Intersected type:`);
                    Debug.log(data)
                    Debug.log(`'${identifier}' Union types memory`);
                    Debug.log((memoryIdentifiers[identifier] as AstNode).getAllMemoryData())
                    Debug.log(`The union types:`);
                    const unionData = data as IntersectedUnionType;
                    for (let unionIndex = 0; unionIndex < unionData.unionLength; unionIndex++) {
                        Debug.log(`Union child: ${unionIndex}/${unionData.unionLength - 1}:`);
                        Debug.log(unionData.getUnion(unionIndex))
                    }
                    Debug.log(`Intersection's non union part:`);
                    Debug.log(unionData.records)
                } else if (data instanceof UnionTypeDeclaration) {
                    Debug.log(`'${identifier}' Union type:`);
                    Debug.log(data)
                    Debug.log(`'${identifier}' Union types memory`);
                    Debug.log((memoryIdentifiers[identifier] as AstNode).getAllMemoryData())
                    Debug.log(`The union types:`);
                    const unionData = data as UnionTypeDeclaration;
                    for (let unionIndex = 0; unionIndex < unionData.unionLength; unionIndex++) {
                        Debug.log(`Union child: ${unionIndex}/${unionData.unionLength - 1}:`);
                        Debug.log(unionData.getUnion(unionIndex))
                    }
                } else {
                    if (identifier === 'Generic') {
                        Debug.log(`'${identifier}' Non union type data`);
                        Debug.log(memoryIdentifiers[identifier])
                    }
                }
            }
        }

        return Result.ok();
    }

    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    private lintImports = async <T>(contentModuleType: ModuleCategory, contents: AllPageTraits, projectMemory: ProjectMemory): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            const moduleURL = modulePath as ModuleURL;
            // It's from the cache.
            if (contents[moduleURL].uiContent === undefined) {
                continue;
            } else if (contents[moduleURL].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = projectMemory.getModuleMemory<T>(moduleURL);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`
                )
            }

            // Debug.push(`code.getLintedImportIdentifiers()`, {memory: modulePath})
            const depsIdentified = await contents[moduleURL].code.getLintedImportIdentifiers<T>(memory.getValue(), projectMemory)
            // Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(
                    `code.getLintedImportIdentifiers(modulePath: '${modulePath}'): ${depsIdentified.errorTitle}`,
                    depsIdentified.errorDescription!
                )
            }

            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.getValue().addIdentifiers(depsIdentified.getValue());
            }
        }

        return Result.ok();
    }

    private identifyTypes = async <T>(contentModuleType: ModuleCategory, contents: AllPageTraits, pageMemories: ModuleMemories<Page>, projectMemory: ProjectMemory): Promise<Result<undefined>> => {
        for (let modulePath in contents) {
            const moduleURL = modulePath as ModuleURL;
            // It's from the cache.
            // It's from the cache.
            if (contents[moduleURL].uiContent === undefined) {
                continue;
            } else if (contents[moduleURL].code === undefined) {
                continue;
            }

            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = projectMemory.getModuleMemory<T>(moduleURL);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(
                    `this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`,
                    `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`
                )
            }

            Debug.push(`code.getTypeIdentifiers()`, {memory: modulePath})
            const identifiers = await contents[moduleURL].code.getTypeIdentifiers();
            Debug.pop();
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
                pageMemories[modulePath as ModuleURL].addIdentifiers(identifiers.getValue());
            }
        }

        return Result.ok();
    }

}