import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator, type TypedData, AstNodeContext } from "../index.js";
/**
 * Property assignment such as {...obj} of the object literals
 */
export declare class SpreadLiteral {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
