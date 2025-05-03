import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import type { TypedData } from "./ast-node.js";
import type { AstNodeContext } from "./AstNodeContext.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class Literal {
    static get name(): string;
    static isStringLiteral: TsNodeValidator;
    static isNumericLiteral: TsNodeValidator;
    static isBooleanLiteral: TsNodeValidator;
    static isA: TsNodeValidator;
    static identifyStringLiteral: (tsNode: TsNode) => Result<TypedData>;
    static identifyNumericLiteral: (tsNode: TsNode) => Result<TypedData>;
    static identifyBooleanLiteral: (tsNode: TsNode) => Result<TypedData>;
    identifyValue: (tsNode: TsNode, _?: TypedData, __?: AstNodeContext) => Promise<Result<TypedData>>;
}
