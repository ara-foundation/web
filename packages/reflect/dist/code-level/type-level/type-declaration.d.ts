/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { TypeAliasDeclaration } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement";
import { AstNode, TsNode, type TsNodeValidator } from "../index.js";
export declare class TypeDeclaration extends TsNode {
    protected _tsNode: TypeAliasDeclaration;
    private constructor();
    static fromTsNode(tsNode: TsNode): Result<TypeDeclaration>;
    static isTypeDeclaration: (child: TsNode) => boolean;
    static isTypeParameterDeclaration: TsNodeValidator;
    private identifyGenericDeclaration;
    /**
     * Returns the Generic declaration defined as SyntaxList after the "<" opening
     * bracked that user sends
     * @param tsNode
     * @returns
     */
    static getGenericNodesAfterOpeningClause: (openingClause: TsNode) => TsNode[];
    /**
         *
         * @param node Is the given node is the opening the generic type declarations
         * @returns
     */
    static isGenericOpeningClause: (openingClause: TsNode) => boolean;
    getAstNode: () => Promise<Result<AstNode>>;
}
