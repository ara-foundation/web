import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { TsNode } from "./ts-node.js";
import { Result } from "@ara-web/ts-enhancement";
import type { IdentifiedNodeDataType, ValueType } from "./ast-node-data.js";
import type { ModuleLink } from "../ara-link/ModuleLink.js";
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
    [key: string]: AstNode | AraLink<string>;
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
    get typedData(): TypedData;
    set typedData(_typedData: TypedData);
    get isGenericHandlerExist(): boolean;
    handleGeneric: (genericValues: ValueType[]) => Result<AstNode>;
    putGenericHandler: (genericHandler: GenericHandler) => void;
    putMemoryData(astNode: AstNode): void;
    postMemoryData(index: number, astNode?: AstNode): void;
    memoryDataLength(): number;
    getAllMemoryData(skippedIdentifiers?: string[]): AstNode[];
    getMemoryData(index: number): AstNode | undefined;
    deleteMemoryData(): void;
    static isDefinedInOtherModule: AstNodeValidator;
    static isDefinedInLocal: AstNodeValidator;
    static isDataNotEmpty: AstNodeValidator;
    static isDataLink: AstNodeValidator;
    static isTypeDeclaration: AstNodeValidator;
}
