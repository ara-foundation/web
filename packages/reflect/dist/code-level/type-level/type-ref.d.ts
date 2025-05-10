/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { TypeReferenceNode, Node } from "ts-morph";
import { AraLink, Result } from "@ara-web/p-hintjens";
export declare class TypeRef {
    protected _tsNode: TypeReferenceNode;
    private constructor();
    static isTypeRef: (node: Node) => boolean;
    static fromTsNode(tsNode: Node): Result<TypeRef>;
    /**
     * Checks does the given node has '<SyntaxList>' generic declaration syntax
     * @requires Node as TypeReferenceNode
     * @param tsNode
     * @returns
     */
    private isGenericRefType;
    /**
     * Returns the syntax list as Node that is between '<' and '>' in Typescript
     * @param typeRefNode
     * @requires the tsNode.node must be TypeReferenceNode
     * @returns
     */
    private genericRefValueNodes;
    /**
     *
     * @param typeLink
     * @param typeRefNode
     * @returns
     */
    private identifyGenericRefValue;
    getAraLink: () => Promise<Result<AraLink<string>>>;
}
