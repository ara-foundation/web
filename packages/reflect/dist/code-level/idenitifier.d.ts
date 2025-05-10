import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter } from "./ast-node-traits.js";
import type { TypedData } from "./code-piece.js";
import type { CodePieceContext } from "./code-piece-context.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class Identifier {
    static get name(): string;
    static isA: AstNodeFilter;
    identifyValue: (tsNode: Node, typedData?: TypedData, parentNodeContext?: CodePieceContext) => Promise<Result<TypedData>>;
}
