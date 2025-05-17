/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableStatement as TsVariableStatement, Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type CodePiece } from "../index.js";
export declare class VariableStatement {
    protected _tsNode: TsVariableStatement;
    private _astNodes;
    private constructor();
    static fromTsNode(tsNode: Node): Promise<Result<VariableStatement>>;
    static isVariableStatement: AstNodeFilter;
    static isVariableDeclarationList: AstNodeFilter;
    static isNonImportantKeyword: AstNodeFilter;
    /**
     * Returns the variable's identifier
     */
    getAstIdentifiers: () => CodePiece[];
    /**
     * Variable declaration comes as "var <declaration>" or "let <declaration>"
     * @param tsNode
     * @param publicFlag Indicates whether the ast nodes are public or not
     * @returns
     */
    private identifyVariableDeclarationList;
    /**
     * Get the variable declaration from the variable statement
     * @param varStatement
     * @param memory
     * @returns
     */
    private identifyAstNodes;
}
