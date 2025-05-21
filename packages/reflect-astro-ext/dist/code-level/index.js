import { OkResult, Result } from "@ara-web/p-hintjens";
import { MODULE_SELECTOR, ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import { Code } from "@ara-web/reflect/code-level";
import { Comment } from "./comment.js";
/**
 * Code analyzing
 */
export class CodeLevel {
    constructor() { }
    static identifyMeta = (source) => {
        return Comment.getMetaFromComment(source);
    };
    /**
     * Identifies all the types, variables that were defined in the source code.
     * @returns {Result<AraPage[]>}
     */
    static identifySourceCode = async (source, moduleMemory, projectMemory) => {
        if (source === undefined) {
            return Result.ok(moduleMemory);
        }
        const code = new Code(source, moduleMemory.moduleLink);
        // The identified Imports
        const importsIdentifed = await this.identifyImports(code, projectMemory);
        if (importsIdentifed.isFailure) {
            return Result.fail(`this.identifyImports('${moduleMemory.moduleLink}'): ${importsIdentifed.errorTitle}`, importsIdentifed.errorDescription);
        }
        else {
            let failedPostResult = OkResult.ok();
            importsIdentifed.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = moduleMemory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        // The type declarations
        const identifiedTypes = await this.identifyTypes(code);
        if (identifiedTypes.isFailure) {
            return Result.fail(`this.identifyTypes('${moduleMemory.moduleLink}'): ${identifiedTypes.errorTitle}`, identifiedTypes.errorDescription);
        }
        else {
            let failedPostResult = OkResult.ok();
            identifiedTypes.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = moduleMemory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        // The Linted import identifiers
        const importsLinted = await this.lintImports(code, moduleMemory, projectMemory);
        if (importsLinted.isFailure) {
            return Result.fail(`this.importsLinted('${moduleMemory.moduleLink}'): ${importsLinted.errorTitle}`, importsLinted.errorDescription);
        }
        // The Linted locally defined types
        const typesLinted = await this.lintTypes(code, moduleMemory, projectMemory);
        if (typesLinted.isFailure) {
            return Result.fail(`this.typesLinted('${moduleMemory.moduleLink}'): ${typesLinted.errorTitle}`, typesLinted.errorDescription);
        }
        const identifiedVariables = await code.getVariableIdentifiers();
        if (identifiedVariables.isFailure) {
            return Result.fail(`code.getVariableIdentifiers('${moduleMemory.moduleLink}'): ${identifiedVariables.errorTitle}`, identifiedVariables.errorDescription);
        }
        else {
            let failedPostResult = OkResult.ok();
            identifiedVariables.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = moduleMemory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        const lintVariables = await this.lintVariables(code, moduleMemory, projectMemory);
        if (lintVariables.isFailure) {
            return Result.fail(`this.lintVariables('${moduleMemory.moduleLink}'): ${lintVariables.errorTitle}`, lintVariables.errorDescription);
        }
        return Result.ok(moduleMemory);
    };
    static async identifyCodePiece(expression, moduleMemory, projectMemory) {
        const identifiedResult = await Code.identifyCodePiece(expression, projectMemory, moduleMemory.rest.getAll(MODULE_SELECTOR).map(node => node.getElement()));
        if (identifiedResult.isFailure) {
            return Result.fail(`Code.identifyCodePiece(): ${identifiedResult.errorTitle}`, identifiedResult.errorDescription);
        }
        if (identifiedResult.getValue() === undefined || identifiedResult.getValue().data === undefined) {
            return Result.fail(`Code.identifyCodePeice(): data is undefined`, `The expression '${expression}' is not a valid expression`);
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
    static identifyImports = async (code, projectMemory) => {
        const importIdentifiers = await code.getImportedIdentifiers(projectMemory);
        if (importIdentifiers.isFailure) {
            return Result.fail(`code.getImportedIdentifiers(): ${importIdentifiers.errorTitle}`, importIdentifiers.errorDescription);
        }
        return Result.ok(importIdentifiers.getValue());
    };
    static lintTypes = async (code, memory, projectMemory) => {
        const depsIdentified = await code.getLintedTypeIdentifiers(memory, projectMemory);
        if (depsIdentified.isFailure) {
            return OkResult.fail(`code.getLintedTypeIdentifiers(): ${depsIdentified.errorTitle}`, depsIdentified.errorDescription);
        }
        const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
        if (importIdentifiersCount > 0) {
            let failedPostResult = OkResult.ok();
            depsIdentified.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = memory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        return OkResult.ok();
    };
    static lintVariables = async (code, memory, projectMemory) => {
        const vars = await code.getLintedVariableIdentifiers(memory, projectMemory);
        if (vars.isFailure) {
            return OkResult.fail(`code.getLintedVariableIdentifiers(): ${vars.errorTitle}`, vars.errorDescription);
        }
        const identified = Object.keys(vars.getValue()).length;
        if (identified > 0) {
            let failedPostResult = OkResult.ok();
            vars.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = memory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        return OkResult.ok();
    };
    // LintImports will get the data from the remote modules.
    // Then, will apply them into the identifiers node data types, and data parameters.
    static lintImports = async (code, memory, projectMemory) => {
        const depsIdentified = await code.getLintedImportIdentifiers(memory, projectMemory);
        if (depsIdentified.isFailure) {
            return OkResult.fail(`code.getLintedImportIdentifiers(): ${depsIdentified.errorTitle}`, depsIdentified.errorDescription);
        }
        const importIdentifiersCount = Object.keys(depsIdentified.getValue()).length;
        if (importIdentifiersCount > 0) {
            let failedPostResult = OkResult.ok();
            depsIdentified.getValue().forEach((importedCodePiece) => {
                if (failedPostResult.isFailure) {
                    return;
                }
                const posted = memory.rest.post('*', importedCodePiece);
                if (posted.isFailure) {
                    failedPostResult = posted;
                }
            });
            if (failedPostResult.isFailure) {
                return Result.fail(`moduleMemory.rest.post(): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
            }
        }
        return OkResult.ok();
    };
    /**
     * Parses all the source code, and finds custom types defined by this module
     * @param contentModuleType
     * @param contents
     * @param pageMemories
     * @param projectMemory
     * @returns
     */
    static identifyTypes = async (code) => {
        const identifiers = await code.getTypeIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`code.getTypeIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        return Result.ok(identifiers.getValue());
    };
}
