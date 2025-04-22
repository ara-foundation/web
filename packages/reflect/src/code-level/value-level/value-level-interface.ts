import type { Result } from "@ara-web/ts-enhancement";
import type { TsNode, TsNodeValidator } from "../ts-node.js";
import type { TypedData } from "../ast-node.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";

/* class decorator */
export function staticImplements<T>() {
    return <U extends T>(constructor: U) => {constructor};
}

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