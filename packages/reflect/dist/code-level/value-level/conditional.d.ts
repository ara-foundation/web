import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type TypedData, AstNodeContext } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class Conditional {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
