/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportDeclaration as TsImportDeclaration, Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { CodePiece, type AstNodeFilter } from "../index.js";
export declare class ImportDeclaration {
    private _importClause;
    private _defaultIdentifier?;
    private _identfiers;
    protected _tsNode: TsImportDeclaration;
    private constructor();
    get importClause(): string;
    get defaultIdentifier(): string | undefined;
    get codePieces(): CodePiece[];
    static fromTsNode(tsNode: Node): Promise<Result<ImportDeclaration>>;
    static isImportClause: AstNodeFilter;
    static isImportDeclaration: AstNodeFilter;
    private getNamedImports;
    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    private identifyImportClause;
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
     * @returns {CodePiece[]}
    */
    private getIdentifiers;
}
