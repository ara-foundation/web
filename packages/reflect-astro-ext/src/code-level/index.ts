import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import { Code, type AstIdentifiers } from "@ara-web/reflect/code-level";
import { Comment } from "./comment.js";
import type { Meta } from "../index.js";

/**
 * Code analyzing
 */
export class CodeLevel {
    constructor() {}

    public static identifyMeta = (source: string|undefined): Meta => {
        return Comment.getMetaFromComment(source);
    }
    
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

        // The type declarations
        const identifiedTypes = await this.identifyTypes(code);
        if (identifiedTypes.isFailure) {
            return Result.fail(
                `this.identifyTypes(): ${identifiedTypes.errorTitle}`,
                identifiedTypes.errorDescription!
            )
        }

        // The Linted import identifiers
        const importsLinted = await this.lintImports<T>(code, moduleMemory, projectMemory);
        if (importsLinted.isFailure) {
            return Result.fail(
                `this.importsLinted(): ${importsLinted.errorTitle}`,
                importsLinted.errorDescription!
            )
        }

        // The Linted locally defined types
        const typesLinted = await this.lintTypes<T>(code, moduleMemory, projectMemory);
        if (typesLinted.isFailure) {
            return Result.fail(
                `this.typesLinted(): ${typesLinted.errorTitle}`,
                typesLinted.errorDescription!
            )
        }
        
        return Result.ok(moduleMemory);
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
        const importIdentifiers = await code.getImportedIdentifiers(projectMemory);
        if (importIdentifiers.isFailure) {
            return Result.fail(
                `code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`,
                importIdentifiers.errorDescription!
            )
        }

        return Result.ok(importIdentifiers.getValue());
    }
    
    private static lintTypes = async <T>(code: Code, memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<OkResult> => {
        const depsIdentified = await code.getLintedTypeIdentifiers<T>(memory, projectMemory)
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

        return OkResult.ok();
    }

    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    private static lintImports = async <T>(code: Code, memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<OkResult> => {
        const depsIdentified = await code.getLintedImportIdentifiers<T>(memory, projectMemory)
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
    private static identifyTypes = async (code: Code): Promise<Result<AstIdentifiers>> => {
        const identifiers = await code.getTypeIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(
                `code.getTypeIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        return Result.ok(identifiers.getValue());
    }

}