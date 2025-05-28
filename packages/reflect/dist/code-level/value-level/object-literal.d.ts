import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type TypedData, CodePieceContext } from "../index.js";
/**
 * Literal class identifies the object literals
 */
export declare class ObjectLiteral {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, typedData?: TypedData, astNodeContext?: CodePieceContext) => Promise<Result<TypedData>>;
    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyObjectLiteral;
}
