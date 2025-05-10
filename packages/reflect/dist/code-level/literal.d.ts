import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter } from "./ast-node-traits.js";
import type { TypedData } from "./code-piece.js";
import type { CodePieceContext } from "./code-piece-context.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
export declare class Literal {
    static get name(): string;
    static isStringLiteral: AstNodeFilter;
    static isNumericLiteral: AstNodeFilter;
    static isBooleanLiteral: AstNodeFilter;
    static isA: AstNodeFilter;
    static identifyStringLiteral: (tsNode: Node) => Result<TypedData>;
    static identifyNumericLiteral: (tsNode: Node) => Result<TypedData>;
    static identifyBooleanLiteral: (tsNode: Node) => Result<TypedData>;
    identifyValue: (tsNode: Node, _?: TypedData, __?: CodePieceContext) => Promise<Result<TypedData>>;
}
