import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator, type TypedData, AstNodeContext } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class PrefixUnary {
    static get name(): string;
    private static isSupportedPrefix;
    private static getPrefixType;
    /**
     * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
     * @param data
     * @returns
     */
    private static applyPrefix;
    private static isExpectedType;
    static isPrefixUnary: TsNodeValidator;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
