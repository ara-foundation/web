import { Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
import type { TypedData } from "../../ast-node.js";
/**
 * Literal class identifies the object literals
 */
export declare class ArrayLiteral {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyArrayLiteral;
}
