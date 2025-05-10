/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { NamedImports, Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { CodePieceType, type CodePieceRecord, type AstNodeFilter } from "../index.js";
export declare class NamedImport {
    protected _tsNode: NamedImports;
    private constructor();
    static fromTsNode(tsNode: Node): Result<NamedImport>;
    static isNamedImport: AstNodeFilter;
    static isImportSpecifier: AstNodeFilter;
    /**
     * Overwrites the Node's getChildren, by returning the children of syntax list node in named imports.
     * @returns
     */
    getChildren: () => Node[];
    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     *
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport
     * @param importPath
     * @returns
     */
    static getIdentifiers: (nodeType: CodePieceType, namedChildren: Node[]) => Result<CodePieceRecord>;
}
