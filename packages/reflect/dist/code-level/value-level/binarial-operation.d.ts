import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, CodePieceContext, type TypedData } from "../index.js";
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
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, _?: TypedData, astNodeContext?: CodePieceContext) => Promise<Result<TypedData>>;
}
