import { Debug, Result } from "@ara-web/ts-enhancement";
import { fileNameToUrl, ModuleType } from "./module.js";
import { ModuleMemory } from "./memory/ModuleMemory.js";
import {} from "./ui-level/ui-content.js";
import { fileContentToComponent } from "./component.js";
import { globToUiContent } from "./ui-level/ui-content.js";
import { uiContentToPage } from "./ui-level/page-level.js";
import { Code } from "./code-level/Code.js";
import { ProjectMemory } from "./memory/ProjectMemory.js";
import { EnabledNodejsModules } from "./enabled-nodejs-module.js";
import { AstNode } from "./code-level/ast-node.js";
import { IntersectedUnionType, UnionTypeDeclaration } from "./code-level/ast-node-data.js";
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class Reflect {
    // Category => Path => ModuleMemory Instance
    _memory;
    _autoImportFunc;
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
    putGlobs = (moduleGlobs) => {
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
            let moduleType = moduleCategory;
            const categoryModules = moduleGlobs[moduleCategory];
            if (categoryModules === undefined) {
                continue;
            }
            for (let modulePath in categoryModules) {
                const glob = categoryModules[modulePath].glob;
                if (moduleType === ModuleType.Component || moduleType === ModuleType.Layout) {
                    const moduleMemory = new ModuleMemory(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                }
                else if (moduleType === ModuleType.Page) {
                    const moduleMemory = new ModuleMemory(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                }
                else if (moduleType === ModuleType.NodeJsModule) {
                    const moduleMemory = new ModuleMemory(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                }
                else if (moduleType === ModuleType.Script) {
                    const moduleMemory = new ModuleMemory(moduleType, modulePath, glob);
                    this._memory.putModuleMemory(moduleType, modulePath, moduleMemory);
                }
                else {
                    return Result.fail(`The module '${modulePath}' of '${moduleType}' type is not supported by Reflect, update putGlobs()`);
                }
            }
            // Delete the orphans
            const modulePaths = Object.keys(categoryModules);
            this._memory.cleanMemoryExcept(moduleType, modulePaths);
        }
        return Result.ok();
    };
    /**
     * Put a function that loads the globs whenever any function is called.
     * @param importFunc
     */
    putAutoGlobImporter = (importFunc) => {
        this._autoImportFunc = importFunc;
    };
    _pre = async () => {
        const globsIdentified = this.putGlobs();
        if (globsIdentified.isFailure) {
            return Result.fail(`this.putGlobs(): ${globsIdentified.errorTitle}`, globsIdentified.errorDescription);
        }
        const builtInIdentified = await this.postBuiltInIdentifiers();
        if (builtInIdentified.isFailure) {
            return Result.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
        }
        return Result.ok();
    };
    //****************************************************************
    // 
    // REST
    //
    //****************************************************************
    /**
     * Returns the all the components.
     * Components are not evaluated by internal structures.
     */
    getComponents = async () => {
        const preparationResult = await this._pre();
        if (preparationResult.isFailure) {
            return Result.fail(`this._pre(): ${preparationResult.errorTitle}`, preparationResult.errorDescription);
        }
        const modules = this._memory.getModuleMemories(ModuleType.Component);
        if (modules === undefined) {
            return Result.ok([]);
        }
        const components = [];
        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content);
                continue;
            }
            const component = await fileContentToComponent(moduleMemory);
            if (component.isFailure) {
                return Result.fail(`fileContentToComponent(modulePath: '${moduleMemory.modulePath}'): ${component.errorTitle}`, component.errorDescription);
            }
            this._memory.putModuleContent(ModuleType.Component, modulePath, component.getValue());
            components.push(component.getValue());
        }
        return Result.ok(components);
    };
    /**
     * Returns the all the layout components
     */
    getLayouts = async () => {
        const preparationResult = await this._pre();
        if (preparationResult.isFailure) {
            return Result.fail(`this._pre(): ${preparationResult.errorTitle}`, preparationResult.errorDescription);
        }
        const modules = this._memory.getModuleMemories(ModuleType.Layout);
        if (modules === undefined) {
            return Result.ok([]);
        }
        const components = [];
        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            if (moduleMemory.content !== undefined) {
                components.push(moduleMemory.content);
                continue;
            }
            const component = await fileContentToComponent(moduleMemory);
            if (component.isFailure) {
                return Result.fail(`fileContentToComponent(modulePath: '${moduleMemory.modulePath}'): ${component.errorTitle}`, component.errorDescription);
            }
            this._memory.putModuleContent(ModuleType.Layout, modulePath, component.getValue());
            components.push(component.getValue());
        }
        return Result.ok(components);
    };
    /**
     * Returns all the pages
     * @returns {Result<Page[]>}
     */
    getPages = async () => {
        const preparationResult = await this._pre();
        if (preparationResult.isFailure) {
            return Result.fail(`this._pre(): ${preparationResult.errorTitle}`, preparationResult.errorDescription);
        }
        const pageModules = this._memory.getModuleMemories(ModuleType.Page);
        if (pageModules === undefined) {
            return Result.ok([]);
        }
        const pageTraits = await this.getPageTraits(pageModules);
        if (pageTraits.isFailure) {
            return Result.fail(`this.getPageTraits(): ${pageTraits.errorTitle}`, pageTraits.errorDescription);
        }
        //---------------------------------------------------------------
        //
        // The identified Imports
        //
        //---------------------------------------------------------------
        const importsIdentifed = await this.identifyImports(pageTraits.getValue(), pageModules);
        if (importsIdentifed.isFailure) {
            return Result.fail(`this.identifyImports(): ${importsIdentifed.errorTitle}`, importsIdentifed.errorDescription);
        }
        else {
            this._memory.putModuleMemories(ModuleType.Page, pageModules);
        }
        // let count = 0;
        // Debug.push("Identified nodes")
        //     const modules = this._memory.memories[ModuleType.Page];
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
        const identifiedTypes = await this.identifyTypes(ModuleType.Page, pageTraits.getValue(), pageModules);
        if (identifiedTypes.isFailure) {
            return Result.fail(`this.identifyTypes(): ${identifiedTypes.errorTitle}`, identifiedTypes.errorDescription);
        }
        else {
            this._memory.putModuleMemories(ModuleType.Page, pageModules);
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
        const importsLinted = await this.lintImports(ModuleType.Page, pageTraits.getValue());
        // Debug.pop()
        if (importsLinted.isFailure) {
            return Result.fail(`this.importsLinted(): ${importsLinted.errorTitle}`, importsLinted.errorDescription);
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
        const typesLinted = await this.lintTypes(ModuleType.Page, pageTraits.getValue());
        // Debug.pop()
        if (typesLinted.isFailure) {
            return Result.fail(`this.typesLinted(): ${typesLinted.errorTitle}`, typesLinted.errorDescription);
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
        const pages = Object.keys(pageTraits.getValue()).map((modulePath) => (pageTraits.getValue()[modulePath].page));
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
    };
    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */
    getPageTraits = async (modules) => {
        const contents = {};
        //
        // Validate the modules as valid content, then extract their data.
        //
        for (let modulePath in modules) {
            const moduleMemory = modules[modulePath];
            contents[modulePath] = { page: {} };
            if (moduleMemory.content !== undefined) {
                contents[modulePath].page = moduleMemory.content;
                contents[modulePath].uiContent = undefined;
                continue;
            }
            const uiContent = await globToUiContent(moduleMemory.modulePath, moduleMemory.glob);
            if (uiContent.isFailure) {
                return Result.fail(`globToUiContent(modulePath: '${moduleMemory.modulePath}'): ${uiContent.errorTitle}`, uiContent.errorDescription);
            }
            const page = uiContentToPage(uiContent.getValue());
            if (page.isFailure) {
                return Result.fail(`PageTraits.fromFileContent: ${page.errorTitle}`, page.errorDescription);
            }
            contents[modulePath].page = page.getValue();
            contents[modulePath].uiContent = uiContent.getValue();
        }
        return Result.ok(contents);
    };
    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    //
    postBuiltInIdentifiers = async () => {
        const identifiers = await EnabledNodejsModules.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(undefined);
        }
        for (let moduleTypeStr in ModuleType) {
            const moduleType = moduleTypeStr;
            const moduleMemories = this._memory.getModuleMemories(ModuleType[moduleType]);
            if (moduleMemories === undefined) {
                continue;
            }
            for (let modulePath in moduleMemories) {
                moduleMemories[modulePath].addIdentifiers(identifiers.getValue());
            }
        }
        return Result.ok();
    };
    //
    // Import all data
    //
    identifyImports = async (pageTraits, pageMemories) => {
        for (let modulePath in pageTraits) {
            // It's from the cache.
            if (pageTraits[modulePath].uiContent === undefined) {
                continue;
            }
            pageTraits[modulePath].code = new Code(pageTraits[modulePath].uiContent.source);
            // Debug.push(`code.getImportedIdentifiers()`, {memory: modulePath})
            const importIdentifiers = pageTraits[modulePath].code.getImportedIdentifiers();
            // Debug.pop();
            if (importIdentifiers.isFailure) {
                return Result.fail(`code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`, importIdentifiers.errorDescription);
            }
            const importIdentifiersCount = Object.keys(importIdentifiers.getValue()).length;
            if (importIdentifiersCount > 0) {
                pageMemories[modulePath].addIdentifiers(importIdentifiers.getValue());
            }
            else {
                Debug.log(`0 imports were identified :( for ${modulePath} page`);
            }
        }
        return Result.ok();
    };
    lintTypes = async (contentModuleType, contents) => {
        for (let modulePath in contents) {
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            }
            else if (contents[modulePath].code === undefined) {
                continue;
            }
            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(`this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`, `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`);
            }
            Debug.push(`code.getLintedTypeIdentifiers()`, { moduleMemory: modulePath });
            const depsIdentified = await contents[modulePath].code.getLintedTypeIdentifiers(memory, this._memory);
            Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(`code.getLintedTypeIdentifiers(modulePath: '${modulePath}'): ${depsIdentified.errorTitle}`, depsIdentified.errorDescription);
            }
            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.addIdentifiers(depsIdentified.getValue());
            }
            Debug.log(`Linted data of '${modulePath}':`);
            const memoryIdentifiers = memory.getIdentifiers([AstNode.isTypeDeclaration]);
            for (let identifier in memoryIdentifiers) {
                const data = memoryIdentifiers[identifier].data;
                Debug.log(`The data of the '${identifier}' type:`);
                Debug.log(data);
                if (data instanceof IntersectedUnionType) {
                    Debug.log(`'${identifier}' Intersected type:`);
                    Debug.log(data);
                    Debug.log(`'${identifier}' Union types memory`);
                    Debug.log(memoryIdentifiers[identifier].getAllMemoryData());
                    Debug.log(`The union types:`);
                    const unionData = data;
                    for (let unionIndex = 0; unionIndex < unionData.unionLength; unionIndex++) {
                        Debug.log(`Union child: ${unionIndex}/${unionData.unionLength - 1}:`);
                        Debug.log(unionData.getUnion(unionIndex));
                    }
                    Debug.log(`Intersection's non union part:`);
                    Debug.log(unionData.records);
                }
                else if (data instanceof UnionTypeDeclaration) {
                    Debug.log(`'${identifier}' Union type:`);
                    Debug.log(data);
                    Debug.log(`'${identifier}' Union types memory`);
                    Debug.log(memoryIdentifiers[identifier].getAllMemoryData());
                    Debug.log(`The union types:`);
                    const unionData = data;
                    for (let unionIndex = 0; unionIndex < unionData.unionLength; unionIndex++) {
                        Debug.log(`Union child: ${unionIndex}/${unionData.unionLength - 1}:`);
                        Debug.log(unionData.getUnion(unionIndex));
                    }
                }
                else {
                    if (identifier === 'Generic') {
                        Debug.log(`'${identifier}' Non union type data`);
                        Debug.log(memoryIdentifiers[identifier]);
                    }
                }
            }
        }
        return Result.ok();
    };
    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    lintImports = async (contentModuleType, contents) => {
        for (let modulePath in contents) {
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            }
            else if (contents[modulePath].code === undefined) {
                continue;
            }
            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(`this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`, `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`);
            }
            // Debug.push(`code.getLintedImportIdentifiers()`, {memory: modulePath})
            const depsIdentified = await contents[modulePath].code.getLintedImportIdentifiers(memory, this._memory);
            // Debug.pop();
            if (depsIdentified.isFailure) {
                return Result.fail(`code.getLintedImportIdentifiers(modulePath: '${modulePath}'): ${depsIdentified.errorTitle}`, depsIdentified.errorDescription);
            }
            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.addIdentifiers(depsIdentified.getValue());
            }
        }
        return Result.ok();
    };
    identifyTypes = async (contentModuleType, contents, pageMemories) => {
        for (let modulePath in contents) {
            // It's from the cache.
            // It's from the cache.
            if (contents[modulePath].uiContent === undefined) {
                continue;
            }
            else if (contents[modulePath].code === undefined) {
                continue;
            }
            // Debug.push(`memories.getModuleMemory()`, {moduleType, modulePath})
            const memory = this._memory.getModuleMemory(contentModuleType, modulePath);
            // Debug.pop();
            if (memory === undefined) {
                return Result.fail(`this._memory.getModuleMemory(moduleType: '${contentModuleType}', modulePath: '${modulePath}'): Module not found`, `The memory doesn't have the '${modulePath}' module of '${contentModuleType}' type`);
            }
            Debug.push(`code.getTypeIdentifiers()`, { memory: modulePath });
            const identifiers = await contents[modulePath].code.getTypeIdentifiers();
            Debug.pop();
            if (identifiers.isFailure) {
                return Result.fail(`code.getTypeIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
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
    };
}
