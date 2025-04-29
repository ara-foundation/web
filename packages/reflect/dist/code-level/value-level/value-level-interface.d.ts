import type { Result } from "@ara-web/ts-enhancement/result";
import type { TsNode, TsNodeValidator } from "../ts-node.js";
import type { TypedData } from "../ast-node.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
export interface ValueIdentifierInterface {
    identifyValue(tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>>;
}
/**
 * The ValueInterface to make sure that any TsNode follow the same rule
 */
export interface ValueLevelInterface {
    new (): ValueIdentifierInterface;
    name: string;
    isA: TsNodeValidator;
}
