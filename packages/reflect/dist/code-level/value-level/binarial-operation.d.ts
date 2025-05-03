import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator, AstNodeContext, type TypedData } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class BinarialOperation {
    static get name(): string;
    private static isSupportedOperation;
    private static getBinarialType;
    /**
     * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
     * @param data
     * @returns
     */
    private static applyOperation;
    private static identifyConditionValue;
    private static identifyArithmeticValue;
    private static isBooleanOperation;
    private static isArithmeticOperation;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
