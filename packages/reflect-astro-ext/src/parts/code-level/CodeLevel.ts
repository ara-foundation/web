import { Debug, OkResult, Result, type AraPage } from "@ara-web/ts-enhancement";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect/memory";
import { Code } from "@ara-web/reflect/code-level";
import { AstNode, type AstIdentifiers } from "@ara-web/reflect/code-level/ast-node";
import { IntersectedUnionType, UnionTypeDeclaration } from "@ara-web/reflect/code-level/ast-node@types";

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class CodeLevel {
    constructor() {}
    
    /**
     * Identifies all the types, variables that were defined in the source code.
     * @returns {Result<AraPage[]>}
     */
    public static identifySourceCode = async <T>(source: string|undefined, moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<ModuleMemory<T>>> => {
        if (source === undefined) {
            return Result.ok(moduleMemory);
        }
        const code = new Code(source, moduleMemory.moduleLink);

        // The identified Imports
        const importsIdentifed = await this.identifyImports(code, projectMemory);
        if (importsIdentifed.isFailure) {
            return Result.fail(
                `this.identifyImports(): ${importsIdentifed.errorTitle}`,
                importsIdentifed.errorDescription!
            )
        } else {
            moduleMemory.addIdentifiers(importsIdentifed.getValue());
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
        
        // The type declarations
        const identifiedTypes = await this.identifyTypes<T>(code, moduleMemory);
        if (identifiedTypes.isFailure) {
            return Result.fail(
                `this.identifyTypes(): ${identifiedTypes.errorTitle}`,
                identifiedTypes.errorDescription!
            )
        }

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

        // The Linted import identifiers
        // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        const importsLinted = await this.lintImports<T>(code, moduleMemory, projectMemory);
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

        // The Linted locally defined types
        // Debug.push(`this.lintImports()`, {moduleType: ModuleType.Page})
        const typesLinted = await this.lintTypes<T>(code, moduleMemory, projectMemory);
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

        return Result.ok(moduleMemory);
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

    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */


    //
    // Import clauses identifies on which modules the source code depends on.
    //
    private static identifyImports = async (code: Code, projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        // Debug.push(`code.getImportedIdentifiers()`, {memory: modulePath})
        const importIdentifiers = await code.getImportedIdentifiers(projectMemory);
        // Debug.pop();
        if (importIdentifiers.isFailure) {
            return Result.fail(
                `code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`,
                importIdentifiers.errorDescription!
            )
        }

        return Result.ok(importIdentifiers.getValue());
    }
    
    private static lintTypes = async <T>(code: Code, memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<OkResult> => {
            Debug.push(`code.getLintedTypeIdentifiers()`)
            const depsIdentified = await code.getLintedTypeIdentifiers<T>(memory, projectMemory)
            Debug.pop();
            if (depsIdentified.isFailure) {
                return OkResult.fail(
                    `code.getLintedTypeIdentifiers(): ${depsIdentified.errorTitle}`,
                    depsIdentified.errorDescription!
                )
            }
            
            const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
            if (importIdentifiersCount > 0) {
                memory.addIdentifiers(depsIdentified.getValue());
            }

            Debug.log(`Linted data of`)
            const memoryIdentifiers = memory.getIdentifiers([AstNode.isTypeDeclaration]);
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

        return OkResult.ok();
    }

    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    private static lintImports = async <T>(code: Code, memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<OkResult> => {
        // Debug.push(`code.getLintedImportIdentifiers()`, {memory: modulePath})
        const depsIdentified = await code.getLintedImportIdentifiers<T>(memory, projectMemory)
        // Debug.pop();
        if (depsIdentified.isFailure) {
            return OkResult.fail(
                `code.getLintedImportIdentifiers(): ${depsIdentified.errorTitle}`,
                depsIdentified.errorDescription!
            )
        }

        const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
        if (importIdentifiersCount > 0) {
            memory.addIdentifiers(depsIdentified.getValue());
        }

        return OkResult.ok();
    }

    /**
     * Parses all the source code, and finds custom types defined by this module
     * @param contentModuleType 
     * @param contents 
     * @param pageMemories 
     * @param projectMemory 
     * @returns 
     */
    private static identifyTypes = async <T>(code: Code, memory: ModuleMemory<T>): Promise<Result<AstIdentifiers>> => {
        Debug.push(`code.getTypeIdentifiers()`, {memory: memory.moduleLink.toString()})
        const identifiers = await code.getTypeIdentifiers();
        Debug.pop();
        if (identifiers.isFailure) {
            return Result.fail(
                `code.getTypeIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        return Result.ok(identifiers.getValue());
    }

}