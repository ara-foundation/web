import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, AstNodeContext, type TypedData } from "../index.js";
/**
 * Literal class identifies the object literals
 */
export declare class ArrayLiteral {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyArrayLiteral;
}
