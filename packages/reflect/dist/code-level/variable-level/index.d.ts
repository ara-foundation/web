import { Result } from "@ara-web/ts-enhancement";
import type { AstIdentifiers, TsNode } from "../index.js";
export declare class VariableLevel {
    static getVariableIdentifiers: (tsNodes: TsNode[]) => Promise<Result<AstIdentifiers>>;
}
