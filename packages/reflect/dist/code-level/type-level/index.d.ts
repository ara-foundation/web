import { AraLink, Result } from "@ara-web/p-hintjens";
import { type TypedData, TsNode, AstNode, AstNodeContext, type ValueType, type AstIdentifiers } from "../index.js";
import { type PossibleTypeValue } from "./type-value-traits.js";
export declare class TypeLevel {
    static readonly GENERIC_VALUES_LINK_PROPERTY = "generic_values";
    static linkPropertyToGenericValues: (araLink: AraLink<string>) => ValueType[];
    static genericValuesToLinkProperty: (values: ValueType[]) => object;
    /**
     * Identify the TsNode as the DataType of the `AstNode`.
     * Use this method if you want to identify the value of `AstNode.dataType` property.
     * @param child
     * @returns
     */
    static identifyType: (child: TsNode) => Promise<Result<PossibleTypeValue>>;
    /**
     * Validates the data type of the data
     * @param typedData
     */
    static matchDataToType: (typedData: TypedData) => Result<TypedData>;
    static getTypeIdentifiers: (tsNodes: TsNode[]) => Promise<Result<AstIdentifiers>>;
    /**********************************************************************************
     *
     * Linting
     *
     **********************************************************************************/
    /**
     *
     * @param node
     * @param parentNodeContext
     * @returns
     */
    static lintType: (node: AstNode | AraLink<string>, parentNodeContext: AstNodeContext) => Result<AstNode>;
    /**
     * Data Type has: Memory, Page Memory, and Project Memory.
     * We need to lint the data. The node has no scope memory yet.
     *
     * First, we lint the memory itself if any.
     * By passing: AstNode with empty Memory, Page Memory, and Project Memory
     *
     * Then, we loop over the project data.
     * For each project data, we need to get the scope by adding ast node memory to the local scope
     *
     * @param node
     * @param pageIdentifiers
     * @param projectMemory
     * @returns
     */
    static lintAstNodeMemory: (node: AstNode, nodeContext: AstNodeContext) => Result<AstNode>;
    private static lintTypeData;
    private static lintAraLinkData;
    private static lintObjectData;
}
