import { Node } from "ts-morph";
import { AraLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { type TypedData, CodePiece, AstNodeContext, type ValueType, type CodePieceRecord } from "../index.js";
import { type PossibleTypeValue } from "./type-value-traits.js";
export declare class TypeLevel {
    static readonly GENERIC_VALUES_LINK_PROPERTY = "generic_values";
    static linkPropertyToGenericValues: (araLink: AraLink<string>) => ValueType[];
    static genericValuesToLinkProperty: (values: ValueType[]) => object;
    /**
     * Identify the AstNodeTraits as the DataType of the `CodePiece`.
     * Use this method if you want to identify the value of `CodePiece.dataType` property.
     * @param child
     * @returns
     */
    static identifyType: (child: Node) => Promise<Result<PossibleTypeValue>>;
    /**
     * Validates the data type of the data
     * @param typedData
     */
    static matchDataToType: (typedData: TypedData) => Result<TypedData>;
    static getTypeIdentifiers: (tsNodes: Node[]) => Promise<Result<CodePieceRecord>>;
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
    static lintType: (node: CodePiece | AraLink<string>, parentNodeContext: AstNodeContext) => Result<CodePiece>;
    /**
     * Data Type has: Memory, Page Memory, and Project Memory.
     * We need to lint the data. The node has no scope memory yet.
     *
     * First, we lint the memory itself if any.
     * By passing: CodePiece with empty Memory, Page Memory, and Project Memory
     *
     * Then, we loop over the project data.
     * For each project data, we need to get the scope by adding ast node memory to the local scope
     *
     * @param node
     * @param pageIdentifiers
     * @param projectMemory
     * @returns
     */
    static lintAstNodeMemory: (node: CodePiece, nodeContext: AstNodeContext) => Result<CodePiece>;
    private static lintTypeData;
    private static lintAraLinkData;
    private static lintObjectData;
}
