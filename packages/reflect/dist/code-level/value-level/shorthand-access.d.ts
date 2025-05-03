import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator, type TypedData, AstNodeContext } from "../index.js";
/**
 * Property access such as Object.Property
 */
export declare class ShorthandAccess {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
