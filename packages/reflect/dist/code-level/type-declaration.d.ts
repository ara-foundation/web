/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { TypeAliasDeclaration } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement/result";
import { AstNode } from "./ast-node.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { AstNodeContext } from "../memory/AstNodeContext.js";
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
    /**
     * Data Type has: Memory, Page Memory, and Project Memory.
     * We need to lint the data. The node has no scope memory yet.
     *
     * First, we lint the memory itself if any.
     * By passing: AstNode with empty Memory, Page Memory, and Project Memory
     *
     * Then, we loop over the project data.
     * For each project data, we need to get the scope by adding ast node memory to the local scope
     *
     * @param node
     * @param pageIdentifiers
     * @param projectMemory
     * @returns
     */
    static lintAstNodeMemory: (node: AstNode, nodeContext: AstNodeContext) => Result<AstNode>;
    private static lintAraLinkData;
    private static lintObjectData;
    private static lintTypeData;
    static lintType: (node: AstNode | AraLink<string>, parentNodeContext: AstNodeContext) => Result<AstNode>;
}
