import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, type TypedData, AstNodeContext } from "../index.js";
/**
 * Property assignment such as {...obj} of the object literals
 */
export declare class SpreadLiteral {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
