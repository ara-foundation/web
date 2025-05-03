import type { Result } from "@ara-web/p-hintjens";
import type { AstNodeContext } from "./AstNodeContext.js";
import type { TsNode, TsNodeValidator } from "./ts-node.js";
import type { TypedData } from "./ast-node.js";

export interface ValueIdentifierInterface {
    identifyValue(tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>>;
}

/**
 * The ValueInterface to make sure that any TsNode follow the same rule
 */
export interface ValueLevelInterface {
    new(): ValueIdentifierInterface;
    name: string;
    isA: TsNodeValidator;
}