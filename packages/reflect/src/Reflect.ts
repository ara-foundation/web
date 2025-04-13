import { Debug, Result, type Component, type Page } from "@ara-web/ts-enhancement";
import { ModuleType } from "./module.js";
import { ModuleMemory } from "./memory/ModuleMemory.js";
import { globToFileContent } from "./fileLevel.js";
import { fileContentToComponent } from "./component.js";

export type ModuleGlobs = {
    [key in ModuleType]?: Record<string, unknown>;
};

export class Reflect {
    // Category => Path => ModuleMemory Instance
    private _modules: {[key in ModuleType]?: {[key: string]: ModuleMemory<Component|Page|unknown>}} = {}
    private _autoImportFunc?: () => ModuleGlobs;

    constructor() {}

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
     * @param {ModuleGlobs?} moduleGlobs optional.
     * @notice To enable auto import, simply call the this.putAutoGlobImport(funcReference)
     */
    public putGlobs = (moduleGlobs?: ModuleGlobs): boolean => {
        if (moduleGlobs === undefined) {
            if (this._autoImportFunc === undefined) {
                return false;
            }
        
            moduleGlobs = this._autoImportFunc();
            if (moduleGlobs === undefined) {
                return false;
            }
        }

        for (let moduleCategory in moduleGlobs) {
            let moduleType = moduleCategory as ModuleType;

            const categoryModules = moduleGlobs[moduleCategory as ModuleType];
            if (categoryModules === undefined) {
                continue;
            }

            if (this._modules[moduleType] === undefined) {
                this._modules[moduleType] = {};
            }

            for (let modulePath in categoryModules) {
                const glob = categoryModules[modulePath];
                if (moduleType === ModuleType.Component || moduleType === ModuleType.Layout) {
                    this._modules[moduleType][modulePath] = new ModuleMemory<Component>(moduleType, modulePath, glob);
                } else if (moduleType === ModuleType.Page) {
                    this._modules[moduleType][modulePath] = new ModuleMemory<Page>(moduleType, modulePath, glob);
                } else if (moduleType === ModuleType.NodeJsModule || moduleType === ModuleType.Script) {
                    this._modules[moduleType][modulePath] = new ModuleMemory<unknown>(moduleType, modulePath, glob);
                }
            }

            // Delete the orphans
            const modulePaths = Object.keys(categoryModules);
            let deletedModulePaths = Object.keys(this._modules[moduleType]).filter((modulePath) => (!modulePaths.includes(modulePath)))

            for (let orphan of deletedModulePaths) {
                delete this._modules[moduleType][orphan]
            }
        }

        return true;
    }

    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc 
     */
    public putAutoGlobImporter = (importFunc: (() => ModuleGlobs)|undefined) => {
        this._autoImportFunc = importFunc;
    }

    /**
     * Using each of the globs, it converts them into the files.
     * @returns 
     */
    private putFileContents = async (): Promise<Result<undefined>> => {
        for (let moduleCategory in this._modules) {
            let moduleType = moduleCategory as ModuleType;

            const categoryModules = this._modules[moduleType];
            if (categoryModules === undefined) {
                continue;
            }

            for (let modulePath in categoryModules) {
                const moduleMemory = categoryModules[modulePath]
                if (moduleMemory.fileContent === undefined) {
                    const result = await globToFileContent(moduleMemory.modulePath, moduleMemory.glob);
                    if (result.isFailure) {
                        return Result.fail(
                            `globToFileContent(modulePath: '${moduleMemory.modulePath}'): ${result.errorTitle}`,
                            result.errorDescription!
                        )
                    }
                    categoryModules[modulePath].fileContent = result.getValue();
                }
            }

            this._modules[moduleType] = categoryModules;
        }

        return Result.ok();
    }
    
    //****************************************************************
    // 
    // REST
    //
    //****************************************************************

    /**
     * Returns the all the components
     */
    public getComponents = async (): Promise<Result<Component[]>> => {
        this.putGlobs();
        const fileContentsPut = await this.putFileContents();
        if (fileContentsPut.isFailure) {
            return Result.fail(
                `this.putFileContents(): ${fileContentsPut.errorTitle}`,
                fileContentsPut.errorDescription!
            )
        }

        const modules = this._modules[ModuleType.Component];
        if (modules === undefined) {
            return Result.ok([])
        }

        const components: Component[] = [];

        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content as Component);
                continue;
            }

            if (moduleMemory.fileContent === undefined) {
                continue;
            }

            const component = await fileContentToComponent(moduleMemory.fileContent)
            if (component.isFailure) {
                return Result.fail(
                    `fileContentToComponent(modulePath: '${moduleMemory.modulePath}'): ${component.errorTitle}`,
                    component.errorDescription!
                )
            }
            this._modules[ModuleType.Component]![modulePath].content = component.getValue();
            components.push(component.getValue())
        }

        return Result.ok(components);
    }

    /**
     * Returns all the pages
     * @returns {Result<Page[]>}
     */
    public getPages = async () => {
        this.putGlobs();
        const fileContentsPut = await this.putFileContents();
        if (fileContentsPut.isFailure) {
            return Result.fail(
                `this.putFileContents(): ${fileContentsPut.errorTitle}`,
                fileContentsPut.errorDescription!
            )
        }

        const pageModules = this._modules[ModuleType.Page];
        if (pageModules === undefined) {
            return Result.ok([])
        }

        // How it goes?
        const modules = Object.values(pageModules);

        // Check is there a page?
        // If not, then simply call globToPage from the PageTraits.
    }

    /**
     * For debug purpose, dump the reflect to print everything.
     * @param filterKey 
     * @param filterValue 
     */
    public print = (filterKey?: string, filterValue?: any): void => {
        Debug.push(`Memory Dump`)
        for (let moduleCategory in this._modules) {
            Debug.log(`The '${moduleCategory}' modules:`);
            const moduleType = moduleCategory as ModuleType;
            const categoryModules = this._modules[moduleType];

            for (let modulePath in categoryModules) {
                Debug.log(`The '${modulePath}' module:`);
                categoryModules[modulePath].print(filterKey, filterValue)
            }
        }
        
        Debug.pop();
    }

    //************************************************************** */
    //
    // Private
    //
    //************************************************************** */
}