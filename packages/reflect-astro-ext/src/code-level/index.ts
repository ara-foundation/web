import { OkResult, Result } from "@ara-web/p-hintjens";
import { codePieceOps, MODULE_SELECTOR, ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import { Code } from "@ara-web/reflect/code-level";
import { Comment } from "./comment.js";
import type { Meta } from "../index.js";
import type { CodePiece, ValueType } from "@ara-web/reflect/code-level";
import { ObjectNode } from "@ara-web/sds";

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
                `this.identifyImports('${moduleMemory.moduleLink}'): ${importsIdentifed.errorTitle}`,
                importsIdentifed.errorDescription!
            )
        } else {
            let failedPostResult = OkResult.ok();
            const parent = moduleMemory.rest.get!('*')!
            importsIdentifed.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = moduleMemory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
        }

        // The type declarations
        const identifiedTypes = await this.identifyTypes(code);
        if (identifiedTypes.isFailure) {
            return Result.fail(
                `this.identifyTypes('${moduleMemory.moduleLink}'): ${identifiedTypes.errorTitle}`,
                identifiedTypes.errorDescription!
            )
        } else {
            let failedPostResult = OkResult.ok();
            const parent = moduleMemory.rest.get!('*')!
            identifiedTypes.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = moduleMemory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
        }

        // The Linted import identifiers
        const importsLinted = await this.lintImports<T>(code, moduleMemory, projectMemory);
        if (importsLinted.isFailure) {
            return Result.fail(
                `this.importsLinted('${moduleMemory.moduleLink}'): ${importsLinted.errorTitle}`,
                importsLinted.errorDescription!
            )
        }

        // The Linted locally defined types
        const typesLinted = await this.lintTypes<T>(code, moduleMemory, projectMemory);
        if (typesLinted.isFailure) {
            return Result.fail(
                `this.typesLinted('${moduleMemory.moduleLink}'): ${typesLinted.errorTitle}`,
                typesLinted.errorDescription!
            )
        }

        const identifiedVariables = await code.getVariableIdentifiers();
        if (identifiedVariables.isFailure) {
            return Result.fail(
                `code.getVariableIdentifiers('${moduleMemory.moduleLink}'): ${identifiedVariables.errorTitle}`,
                identifiedVariables.errorDescription!
            )
        } else {
            let failedPostResult = OkResult.ok();
            const parent = moduleMemory.rest.get!('*')!
            identifiedVariables.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = moduleMemory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
        }

        const lintVariables = await this.lintVariables<T>(code, moduleMemory, projectMemory);
        if (lintVariables.isFailure) {
            return Result.fail(
                `this.lintVariables('${moduleMemory.moduleLink}'): ${lintVariables.errorTitle}`,
                lintVariables.errorDescription!
            )
        }
        
        return Result.ok(moduleMemory);
    }

    public static async identifyCodePiece(expression: string, moduleMemory: ModuleMemory<unknown>, projectMemory: ProjectMemory): Promise<Result<ValueType>> {
        const identifiedResult = await Code.identifyCodePiece(expression, projectMemory, moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!));
        if (identifiedResult.isFailure) {
            return Result.fail(
                `Code.identifyCodePiece(): ${identifiedResult.errorTitle}`,
                identifiedResult.errorDescription!
            )
        }
        if (identifiedResult.getValue() === undefined || identifiedResult.getValue().data === undefined) {
            return Result.fail(
                `Code.identifyCodePeice(): data is undefined`,
                `The expression '${expression}' is not a valid expression`
            )
        }
        return Result.ok(identifiedResult.getValue().data);
    }


    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */

    //
    // Import clauses identifies on which modules the source code depends on.
    //
    private static identifyImports = async (code: Code, projectMemory: ProjectMemory): Promise<Result<CodePiece[]>> => {
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
            let failedPostResult = OkResult.ok();
            const parent = memory.rest.get!('*')!
            depsIdentified.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = memory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
        }

        return OkResult.ok();
    }

    private static lintVariables = async <T>(code: Code, memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<OkResult> => {
        const vars = await code.getLintedVariableIdentifiers<T>(memory, projectMemory)
        if (vars.isFailure) {
            return OkResult.fail(
                `code.getLintedVariableIdentifiers(): ${vars.errorTitle}`,
                vars.errorDescription!
            )
        }

        const identified = Object.keys(vars.getValue()).length;
        if (identified > 0) {
            let failedPostResult = OkResult.ok();
            const parent = memory.rest.get!('*')!
            vars.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = memory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
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
            let failedPostResult = OkResult.ok();
            const parent = memory.rest.get!('*')!
            depsIdentified.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
                const posted = memory.rest.post!('*', posting);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
            }
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
    private static identifyTypes = async (code: Code): Promise<Result<CodePiece[]>> => {
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