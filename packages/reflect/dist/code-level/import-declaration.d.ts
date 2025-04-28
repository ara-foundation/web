/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportDeclaration as TsImportDeclaration } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement";
import { type AstIdentifiers } from "./ast-node.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { ModuleLink } from "../ara-link/ModuleLink.js";
import type { ProjectMemory } from "../memory/ProjectMemory.js";
export declare class ImportDeclaration extends TsNode {
    private _moduleLink;
    protected _tsNode: TsImportDeclaration;
    private constructor();
    static fromTsNode(tsNode: TsNode, callingModulePath: ModuleLink, projectMemory: ProjectMemory): Promise<Result<ImportDeclaration>>;
    static isImportClause: TsNodeValidator;
    static isImportDeclaration: TsNodeValidator;
    private getNamedImports;
    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    private getModuleLink;
    /**
     * Syntax to support:
     * import DefaultName from "string-literal-path".
     * @param astImport
     * @returns
     */
    private identifyImportDefaultIdentifier;
    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     *
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport
     * @param importPath
     * @returns
     */
    private identifyNamedImports;
    /**
     * Does the given ImportDeclaration holds the definition of the literal?
     *
     * Import declarations could be default if it's a single literal.
     *
     * import DefaultName from "string-literla-path"
     * @returns {AstIdentifiers}
    */
    getIdentifiers: () => Result<AstIdentifiers>;
}
