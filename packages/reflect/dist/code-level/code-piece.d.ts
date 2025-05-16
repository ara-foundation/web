import { Node } from "ts-morph";
import { ModuleLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import type { IdentifiedNodeDataType, ValueType } from "./code-piece-types.js";
export declare enum CodePieceType {
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
export type CodePieceRecord = Record<string, CodePiece>;
export type CodePieceFilter = (astNode: CodePiece) => boolean;
export type GenericHandler = (astNode: CodePiece, values: ValueType[]) => Result<CodePiece>;
export type TypedData = Pick<CodePiece, "data" | "dataType">;
export declare class CodePiece {
    static readonly GenericNodeLength = 3;
    nodeType?: CodePieceType;
    constant?: boolean;
    public?: boolean;
    dataType?: IdentifiedNodeDataType;
    data?: ValueType;
    importPath?: ModuleLink;
    identifier?: string;
    private _genericHandler?;
    private _nodeMemory?;
    private _tsNode;
    get tsNode(): Node;
    protected constructor(tsNode: Node);
    static fromTsNode(tsNode: Node): CodePiece;
    isObjectBinding(): boolean;
    getBindedObject(): CodePiece | undefined;
    putBindedObjectData(data: ValueType): void;
    get typedData(): TypedData;
    set typedData(_typedData: TypedData);
    get isGenericHandlerExist(): boolean;
    handleGeneric: (genericValues: ValueType[]) => Result<CodePiece>;
    putGenericHandler: (genericHandler: GenericHandler) => void;
    /**
     * Put internal memory. Wrong, it should be postMemory.
     * @param astNode
     * @returns
     */
    putMemoryData(astNode: CodePiece): void;
    /**
     * Post internal memory data. it should be putMemmory.
     * @param index
     * @param astNode
     */
    postMemoryData(index: number, astNode?: CodePiece): void;
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
    getAllMemoryData(skippedIdentifiers?: string[]): CodePiece[];
    /**
     * Get the memory data by index.
     * @param index
     * @returns
     */
    getMemoryData(index: number): CodePiece | undefined;
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
    static isDefinedInOtherModule: CodePieceFilter;
    /**
     * This node was defined in the same module, therefore it has no import path.
     * @param child
     * @returns
     */
    static isDefinedInLocal: CodePieceFilter;
    /**
     * This node has a data? It can't be literal value.
     * It must be a link, non-empty array or object.
     * @param child
     * @returns
     */
    static isDataNotEmpty: CodePieceFilter;
    /**
     * Is node data value is a link to another node?
     * @param child
     * @returns
     */
    static isDataLink: CodePieceFilter;
    /**
     * Is it a type declaration?
     * @param child
     * @returns
     */
    static isTypeDeclaration: CodePieceFilter;
    /**
     * Is it a variable declaration?
     * @param child
     * @returns
     */
    static isVariableDeclaration: CodePieceFilter;
}
