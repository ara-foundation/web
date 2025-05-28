import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, CodePieceContext, type TypedData } from "../index.js";
/**
 * Property access such as Object.Property
 */
export declare class PropertyAccess {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, _?: TypedData, astNodeContext?: CodePieceContext) => Promise<Result<TypedData>>;
}
