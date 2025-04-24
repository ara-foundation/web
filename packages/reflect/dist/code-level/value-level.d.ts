/**
 * Handles the AST Node's values
 */
import { Result } from "@ara-web/ts-enhancement";
import { ValueTypeString, type ValueType } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";
import { type AstNode, type TypedData } from "./ast-node.js";
import type { AstNodeContext } from "../memory/AstNodeContext.js";
export declare class ValueLevel {
    static emptyValueByType: (identifier: string, val: ValueTypeString | ValueType | undefined) => Result<ValueType>;
    /**
     * Exact Value of the node by node type.
     * If node type is the not a value type string,
     * then it's considered as the Custom type.
     * The custom types converted into data.
     *
     * If the type is a value type string,
     * then,
     * @param identifier
     * @param val
     * @param data
     * @returns
     */
    static exactValueByType: (typedData: TypedData) => Result<ValueType>;
    /**
     * Get the possible value type of the expression
     * @param tsNode
     * @returns
     */
    static getValueTypeString: (tsNode: TsNode) => Result<ValueTypeString>;
    /**
     * Get the ValueTypeString by the given data
     * @param data
     * @returns
     */
    static getValueTypeStringByData: (data?: ValueType) => Result<ValueTypeString>;
    /**
     * Identify the value of the {tsNode}, and update the ast node.
     * @returns
     */
    static identifyValue: (tsNode: TsNode, typedData: TypedData, astNodeContext: AstNodeContext) => Promise<Result<TypedData>>;
    private static identifyDataType;
    /**
     * @param astNode Evaluate all the AST Node data property
     * @limitation Only supports AST Nodes that are Links to the expressions.
     * @returns
     */
    static identifyAstNodeData: (astNode: AstNode, astNodeContext: AstNodeContext) => Promise<Result<TypedData>>;
    /**
     * Identify the data of the Ast Node if it's a link to the Expression
     * @param astNode
     * @returns
     */
    private static identifyExpressionLinkData;
}
