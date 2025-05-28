import { Node } from "ts-morph";
import type { Result } from "@ara-web/p-hintjens";
import type { CodePieceContext } from "./code-piece-context.js";
import type { AstNodeFilter } from "./ast-node-traits.js";
import type { TypedData } from "./code-piece.js";
export interface ValueIdentifier {
    identifyValue(tsNode: Node, typedData?: TypedData, astNodeContext?: CodePieceContext): Promise<Result<TypedData>>;
}
/**
 * The ValueInterface to make sure that any Node follow the same rule
 */
export interface ValueAstNode {
    new (): ValueIdentifier;
    name: string;
    isA: AstNodeFilter;
}
