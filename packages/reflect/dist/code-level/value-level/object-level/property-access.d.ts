import { Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import type { TypedData } from "../../ast-node.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
/**
 * Property access such as Object.Property
 */
export declare class PropertyAccess {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
