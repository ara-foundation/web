/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableDeclaration as TsVariableDeclaration, Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { CodePiece, type AstNodeFilter } from "../index.js";
export declare class VariableDeclaration {
    protected _tsNode: TsVariableDeclaration;
    private _publicFlag;
    private _constantFlag;
    private constructor();
    static fromTsNode(tsNode: Node, flags: {
        public: boolean;
        constant: boolean;
    }): Result<VariableDeclaration>;
    static isVariableDeclaration: AstNodeFilter;
    static isObjectBindingPattern: AstNodeFilter;
    /**
     * Returns the variable's identifier
     */
    getIdentifier: () => Result<string>;
    /**
     * Parses this variable declaration into the list of AST Nodes.
     * @returns {CodePiece[]}
     */
    getAstIdentifiers: () => Promise<Result<CodePiece[]>>;
    private getTypedData;
}
