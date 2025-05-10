import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type TypedData, type AstNodeFilter, AstNodeContext } from "../index.js";
/**
 * Property assignment such as Property: <expression> in the context of the object literals
 */
export declare class PropertyLiteral {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
