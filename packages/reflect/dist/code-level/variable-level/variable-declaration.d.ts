/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableDeclaration as TsVariableDeclaration } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstIdentifiers, TsNode, type TsNodeValidator } from "../index.js";
export declare class VariableDeclaration extends TsNode {
    protected _tsNode: TsVariableDeclaration;
    private _publicFlag;
    private _constantFlag;
    private constructor();
    static fromTsNode(tsNode: TsNode, flags: {
        public: boolean;
        constant: boolean;
    }): Result<VariableDeclaration>;
    static isVariableDeclaration: TsNodeValidator;
    static isObjectBindingPattern: TsNodeValidator;
    /**
     * Returns the variable's identifier
     */
    getIdentifier: () => Result<string>;
    /**
     * Parses this variable declaration into the list of AST Nodes.
     * @returns {AstIdentifiers}
     */
    getAstIdentifiers: () => Promise<Result<AstIdentifiers>>;
    private getTypedData;
}
