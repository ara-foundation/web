import { type CategorizedModules, type ExtensionInterface } from "@ara-web/reflect";
import { Debug, enumValues, OkResult, Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory, type ModuleMemories } from "@ara-web/reflect/memory";
import { fileContentToComponent } from "./component.js";
import { ModuleCategory, modulePathToAllPossibleFileNames, ModulePartitioner } from "./module.js";
import { ModuleLink, type ModuleURL } from "@ara-web/reflect/ara-link";
import type { PossibleModuleLinksBuilder } from "@ara-web/reflect";
import { trimPath } from "@ara-web/reflect/module";
import { CodeLevel } from "./parts/code-level/CodeLevel.js";

/**
 * ReflectExtension adds Astro Framework support.
 */
export class ReflectExtension implements ExtensionInterface {
    constructor() {}
    
    public get name(): string {
        return "reflect-astro-ext";
    }

    public get namespace(): string {
        return "@ara-web";
    }

    public get moduleName(): string {
        return `${this.namespace}/${this.name}`;
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

    public getModuleCategory = (modulePath: string): Result<ModuleCategory> => {
        //modulePath = trimPath(modulePath);
        if (!modulePath.includes("src/")) {
            return Result.fail(`The Astro Framework records must be in the 'src' directory`, `Please pass correct path or update ${this.moduleName} to support '${modulePath}'`)
        }

        for (let moduleCategory of this.moduleCategories) {
            if (modulePath.includes(`src/${moduleCategory}`)) {
                return Result.ok(moduleCategory as ModuleCategory);
            }
        }

        return Result.fail(`Failed to categorize, module path is not in any category`, `Please update ${this.moduleName} to support '${modulePath}'`)
    }

    public getCategorizedModuleData(moduleRecords: Record<string, unknown>): Result<CategorizedModules> {
        const categorizedModules: CategorizedModules = {};
        for (let modulePath in moduleRecords) {
            const moduleCategory = this.getModuleCategory(modulePath);
            if (moduleCategory.isFailure) {
                return Result.fail(`this.getModuleCategory('${modulePath}'): ${moduleCategory.errorTitle}`, moduleCategory.errorDescription!)
            }
            if (categorizedModules[moduleCategory.getValue()] === undefined) {
                categorizedModules[moduleCategory.getValue()] = {};
            }
            categorizedModules[moduleCategory.getValue()][modulePath] = {
                glob: moduleRecords[modulePath]
            }
        } 
    
        return Result.ok(categorizedModules);
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
     * ModulePath is received from the 'import clauses' converted into Module Links
     * defined in @ara-web/reflect/src/ara-link/ModuleLink.ts
     */
    public getPossibleModuleLinks: PossibleModuleLinksBuilder = (importClause: string): ModuleLink[] => {
        // importClause = trimPath(importClause);
        const moduleLinks: ModuleLink[] = [];
        const moduleCategories = this.moduleCategories;
        for (let moduleCategory of moduleCategories) {
            const moduleLink = new ModuleLink(this.namespace, this.name, moduleCategory, importClause)
            moduleLinks.push(moduleLink)

            const modulePaths = modulePathToAllPossibleFileNames(importClause);
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
            const contents = await this.postPageContents(projectMemory);
            if (contents.isFailure) {
                return Result.fail(`this.postPageContents(): ${contents.errorTitle}`, contents.errorDescription!)
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
     * Check all modules and if no content is given, then return
     * @returns {Result<Page[]>}
     */
    private postPageContents = async (projectMemory: ProjectMemory): Promise<OkResult> => {
        const noContentModules = projectMemory.getNoContentModules<Page>(ModuleCategory.Page);
        // identify ui content
        // identify source code
        // identify the page
        Debug.log(`Fetch the no content modules:`)
        Debug.log(Object.keys(noContentModules))
        for (let modulePath in noContentModules) {
            const moduleURL = modulePath as ModuleURL;
            const moduleMemory = noContentModules[moduleURL] as ModuleMemory<Page>;
            const moduleParts = await ModulePartitioner.partition<Page>(moduleMemory);
            if (moduleParts.isFailure) {
                return OkResult.fail(`UILevel.identifyModuleParts<Page>('${moduleURL}'): ${moduleParts.errorTitle}`, moduleParts.errorDescription!);
            }

            const identifiedMemory = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
            if (identifiedMemory.isFailure) {
                return OkResult.fail(`CodeLevel.identifySourceCode('${moduleURL}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription!)
            }
            Debug.log(`TODO: '${moduleURL}' make sure to generate the content of the web page`);
            
            projectMemory.putModuleMemory(identifiedMemory.getValue());
        }
        return OkResult.ok();
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

}