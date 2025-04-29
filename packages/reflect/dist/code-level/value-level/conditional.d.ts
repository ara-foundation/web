import { Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator, type TypedData, AstNodeContext } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class Conditional {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
