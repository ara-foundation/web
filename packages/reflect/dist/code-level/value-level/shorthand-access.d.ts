import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type TypedData, AstNodeContext } from "../index.js";
/**
 * Property access such as Object.Property
 */
export declare class ShorthandAccess {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
