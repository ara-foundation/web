import { Result } from "@ara-web/ts-enhancement/result";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { TypedData } from "./ast-node.js";
export type LiteralType = string | number | boolean;
export type EnumMembers = {
    [key: string]: string | number;
};
export declare enum ValueTypeString {
    default = "default",// The type that was passed
    string = "string",
    number = "number",
    array = "array",
    object = "object",
    property = "property",
    boolean = "boolean",
    undefined = "undefined"
}
export interface TypeObjectInterface {
    length: number;
    records: Record<string, IdentifiedNodeDataType>;
    isChild(key: string): boolean;
    post(record: Record<string, IdentifiedNodeDataType>): boolean;
    put(record: Record<string, IdentifiedNodeDataType>): boolean;
    putOrPost(record: Record<string, IdentifiedNodeDataType>): void;
    get(key: string): IdentifiedNodeDataType | undefined;
}
export interface UnionTypeInterface {
    unionLength: number;
    union: IdentifiedNodeDataType[];
    postUnion(typeValue: IdentifiedNodeDataType): void;
    putUnion(index: number, dataType: IdentifiedNodeDataType): void;
    putOrPostUnion(unions: IdentifiedNodeDataType[]): void;
    isUnionChildExist(index: number): boolean;
    getUnion(index: number): IdentifiedNodeDataType | undefined;
}
interface IntersectedUnionInterface extends TypeObjectInterface, UnionTypeInterface {
    unions: UnionTypeInterface;
    araLinks: Array<AraLink<string>>;
    putUnions(unions: UnionTypeInterface): void;
    postAraLink(araLink: AraLink<string>): void;
}
export declare class TypeDeclaration implements TypeObjectInterface {
    protected _records: Record<string, IdentifiedNodeDataType>;
    constructor();
    putOrPost(record: Record<string, IdentifiedNodeDataType>): void;
    get length(): number;
    get records(): Record<string, IdentifiedNodeDataType>;
    post(record: Record<string, IdentifiedNodeDataType>): boolean;
    isChild(key: string): boolean;
    get(key: string): IdentifiedNodeDataType | undefined;
    put(record: Record<string, IdentifiedNodeDataType>): boolean;
    identifyData: (data: any) => Result<object>;
    postDataType: (dataType: IdentifiedNodeDataType | undefined) => Result<TypeDeclaration>;
}
export type ValueType = LiteralType | Array<any> | Object | EnumMembers | AraLink<any> | TypeDeclaration | UnionTypeDeclaration;
export type IdentifiedNodeDataType = ValueTypeString | ValueType;
export declare class UnionTypeDeclaration implements UnionTypeInterface {
    protected _values: IdentifiedNodeDataType[];
    constructor();
    get union(): IdentifiedNodeDataType[];
    putOrPostUnion(unions: IdentifiedNodeDataType[]): void;
    get unionLength(): number;
    postUnion(typeValue: IdentifiedNodeDataType): void;
    isUnionChildExist(index: number): boolean;
    getUnion(index: number): IdentifiedNodeDataType | undefined;
    putUnion(index: number, dataType: IdentifiedNodeDataType): void;
    identifyData: (data: any) => Result<TypedData>;
}
export declare class IntersectedUnionType extends TypeDeclaration implements IntersectedUnionInterface {
    protected _unions: UnionTypeDeclaration;
    protected _araLinks: AraLink<string>[];
    constructor(obj?: TypeDeclaration | IntersectedUnionType);
    get araLinks(): AraLink<string>[];
    postAraLink(araLink: AraLink<string>): void;
    get unions(): UnionTypeDeclaration;
    putUnions(unions: UnionTypeDeclaration): void;
    get union(): IdentifiedNodeDataType[];
    putOrPostUnion(unions: IdentifiedNodeDataType[]): void;
    get unionLength(): number;
    postUnion(typeValue: IdentifiedNodeDataType): void;
    isUnionChildExist(index: number): boolean;
    getUnion(index: number): IdentifiedNodeDataType | undefined;
    putUnion(index: number, dataType: IdentifiedNodeDataType): void;
    private get typeDeclaration();
    identifyData: (data: any) => Result<TypedData>;
}
export {};
