import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import type { CodePieceRecord } from "../index.js";
export declare class VariableLevel {
    static getVariableIdentifiers: (tsNodes: Node[]) => Promise<Result<CodePieceRecord>>;
}
