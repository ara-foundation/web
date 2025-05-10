import { ModuleLink, Result } from "@ara-web/p-hintjens";
import type { TsNode } from "./ts-node.js";
import type { IdentifiedNodeDataType, ValueType } from "./ast-node-data.js";
export declare enum AstNodeType {
    Variable = "variable",
    Enum = "enum",
    Function = "function",
    Class = "class",
    Object = "object",
    Property = "property",
    Type = "type",
    Array = "array",
    Literal = "literal"
}
/**
 * identity -> AstNode or
 * identity -> AraLink to another identity
 */
export type AstIdentifiers = {
    [key: string]: AstNode;
};
export type AstNodeValidator = (astNode: AstNode) => boolean;
export type GenericHandler = (astNode: AstNode, values: ValueType[]) => Result<AstNode>;
export type TypedData = Pick<AstNode, "data" | "dataType">;
export declare class AstNode {
    static readonly GenericNodeLength = 3;
    nodeType?: AstNodeType;
    constant?: boolean;
    public?: boolean;
    dataType?: IdentifiedNodeDataType;
    data?: ValueType;
    importPath?: ModuleLink;
    identifier?: string;
    private _genericHandler?;
    private _nodeMemory?;
    private _tsNode;
    get tsNode(): TsNode;
    protected constructor(tsNode: TsNode);
    static fromTsNode(tsNode: TsNode): AstNode;
    isObjectBinding(): boolean;
    getBindedObject(): AstNode | undefined;
    putBindedObjectData(data: ValueType): void;
    get typedData(): TypedData;
    set typedData(_typedData: TypedData);
    get isGenericHandlerExist(): boolean;
    handleGeneric: (genericValues: ValueType[]) => Result<AstNode>;
    putGenericHandler: (genericHandler: GenericHandler) => void;
    /**
     * Put internal memory. Wrong, it should be postMemory.
     * @param astNode
     * @returns
     */
    putMemoryData(astNode: AstNode): void;
    /**
     * Post internal memory data. it should be putMemmory.
     * @param index
     * @param astNode
     */
    postMemoryData(index: number, astNode?: AstNode): void;
    /**
     * How many internal memory data is assigned to this node?
     * @returns
     */
    memoryDataLength(): number;
    /**
     * Return all the internal memory data except {@link skippedIdentifiers}.
     * @param skippedIdentifiers
     * @returns
     */
    getAllMemoryData(skippedIdentifiers?: string[]): AstNode[];
    /**
     * Get the memory data by index.
     * @param index
     * @returns
     */
    getMemoryData(index: number): AstNode | undefined;
    /**
     * Delete the memory data by index.
     * @param index
     * @returns
     */
    deleteMemoryData(index?: number): boolean;
    /**
     * This node was defined in another module, therefore it has an import path.
     * @param child
     * @returns
     */
    static isDefinedInOtherModule: AstNodeValidator;
    /**
     * This node was defined in the same module, therefore it has no import path.
     * @param child
     * @returns
     */
    static isDefinedInLocal: AstNodeValidator;
    /**
     * This node has a data? It can't be literal value.
     * It must be a link, non-empty array or object.
     * @param child
     * @returns
     */
    static isDataNotEmpty: AstNodeValidator;
    /**
     * Is node data value is a link to another node?
     * @param child
     * @returns
     */
    static isDataLink: AstNodeValidator;
    /**
     * Is it a type declaration?
     * @param child
     * @returns
     */
    static isTypeDeclaration: AstNodeValidator;
    /**
     * Is it a variable declaration?
     * @param child
     * @returns
     */
    static isVariableDeclaration: AstNodeValidator;
}
