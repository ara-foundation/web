/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { TypeReferenceNode } from "ts-morph";
import { AraLink, Result } from "@ara-web/ts-enhancement";
import { TsNode } from "../index.js";
export declare class TypeRef extends TsNode {
    protected _tsNode: TypeReferenceNode;
    private constructor();
    static isTypeRef: (child: TsNode) => boolean;
    static fromTsNode(tsNode: TsNode): Result<TypeRef>;
    /**
     * Checks does the given node has '<SyntaxList>' generic declaration syntax
     * @requires TsNode.node is TypeReferenceNode
     * @param tsNode
     * @returns
     */
    private isGenericRefType;
    /**
     * Returns the syntax list as TsNode that is between '<' and '>' in Typescript
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
