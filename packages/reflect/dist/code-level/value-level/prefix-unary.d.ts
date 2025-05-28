import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type TypedData, CodePieceContext } from "../index.js";
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
    static isPrefixUnary: AstNodeFilter;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, _?: TypedData, astNodeContext?: CodePieceContext) => Promise<Result<TypedData>>;
}
