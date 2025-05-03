import { Result } from "@ara-web/p-hintjens";
import { type TypedData, TsNode, type TsNodeValidator, AstNodeContext } from "../index.js";
/**
 * Property assignment such as Property: <expression> in the context of the object literals
 */
export declare class PropertyLiteral {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
