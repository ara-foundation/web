import { Result } from "@ara-web/p-hintjens";
import { TsNode, type TsNodeValidator, AstNodeContext, type TypedData } from "../index.js";
/**
 * Property access such as Object.Property
 */
export declare class PropertyAccess {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
