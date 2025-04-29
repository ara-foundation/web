/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableStatement as TsVariableStatement } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator, type AstIdentifiers } from "../index.js";
export declare class VariableStatement extends TsNode {
    protected _tsNode: TsVariableStatement;
    private _astNodes;
    private constructor();
    static fromTsNode(tsNode: TsNode): Promise<Result<VariableStatement>>;
    static isVariableStatement: TsNodeValidator;
    static isVariableDeclarationList: TsNodeValidator;
    static isNonImportantKeyword: TsNodeValidator;
    /**
     * Returns the variable's identifier
     */
    getAstIdentifiers: () => AstIdentifiers;
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
