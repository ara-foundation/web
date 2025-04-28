import { Result } from "@ara-web/ts-enhancement/result";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import type { TypedData } from "../../ast-node.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
/**
 * Property assignment such as Property: <expression> in the context of the object literals
 */
export declare class PropertyLiteral {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
}
