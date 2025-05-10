/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { Node, TypeAliasDeclaration } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { CodePiece, type AstNodeFilter } from "../index.js";
export declare class TypeDeclaration {
    protected _tsNode: TypeAliasDeclaration;
    private constructor();
    static fromTsNode(tsNode: Node): Result<TypeDeclaration>;
    getText(): string;
    static isTypeDeclaration: (child: Node) => boolean;
    static isTypeParameterDeclaration: AstNodeFilter;
    private identifyGenericDeclaration;
    /**
     * Returns the Generic declaration defined as SyntaxList after the "<" opening
     * bracked that user sends
     * @param tsNode
     * @returns
     */
    static getGenericNodesAfterOpeningClause: (openingClause: Node) => Node[];
    /**
         *
         * @param node Is the given node is the opening the generic type declarations
         * @returns
     */
    static isGenericOpeningClause: (openingClause: Node) => boolean;
    getAstNode: () => Promise<Result<CodePiece>>;
}
