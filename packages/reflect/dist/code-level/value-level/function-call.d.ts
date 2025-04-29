import { Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator, type TypedData, AstNodeContext } from "../index.js";
/**
 * Calls the function.
 */
export declare class FunctionCall {
    static get name(): string;
    static isA: TsNodeValidator;
    identifyValue: (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext) => Promise<Result<TypedData>>;
    private getFuncArgs;
    /**
     *
     * @param method
     * @param methodArgs
     * @param memory
     * @returns
     */
    private identifyMethodCall;
    /**
         * Call the function and return it's result
         * @param {string} funcName function literal
         * @param {any[]} funcArgs function argument
         * @returns {error?: string, data?: T}
     */
    private identifyFunctionCall;
}
