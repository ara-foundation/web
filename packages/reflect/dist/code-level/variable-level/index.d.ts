import { Result } from "@ara-web/p-hintjens";
import type { AstIdentifiers, TsNode } from "../index.js";
export declare class VariableLevel {
    static getVariableIdentifiers: (tsNodes: TsNode[]) => Promise<Result<AstIdentifiers>>;
}
