import { Node } from "ts-morph";
import type { Result } from "@ara-web/p-hintjens";
import type { CodePieceContext } from "./code-piece-context.js";
import type { AstNodeFilter } from "./ast-node-traits.js";
import type { TypedData } from "./code-piece.js";

export interface ValueIdentifierInterface {
    identifyValue(tsNode: Node, typedData?: TypedData, astNodeContext?: CodePieceContext): Promise<Result<TypedData>>;
}

/**
 * The ValueInterface to make sure that any Node follow the same rule
 */
export interface ValueLevelInterface {
    new(): ValueIdentifierInterface;
    name: string;
    isA: AstNodeFilter;
}