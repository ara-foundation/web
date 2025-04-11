import type { AraLink } from "@scripts/aralink/types";

export enum AstNodeType {
    Variable = "variable",
    Enum = "enum",
    Function = "function",
    Class = "class",
    Object = "object",
    Type = "type",
    Array= "array",
}

export enum ValueTypeString {
    default = "default",    // The type that was passed
    string = "string",
    number = "number",
    array = "array",
    object = "object",
    property = "property",
    boolean = "boolean",
}

export type EnumMembers = {[key: string]: string|number};

export type ValueType = string | number | Array<ValueType> | Object | boolean | EnumMembers | AraLink | TypeDeclaration;

export type IdentifiedNodeDataType = ValueTypeString | AraLink;

export type IdentifiedNode = {
    nodeType: AstNodeType,
    constant?: boolean,
    public?: boolean;   // If the module exposes it
    dataType?: IdentifiedNodeDataType,    // Identify the value in the future
    data?: ValueType,
    importPath?: AraLink,    // the import identifier
    identifier?: string,
}

export type TypeDeclaration = {[key: string]: ValueType};

export type Identifiers = {[key: string]: IdentifiedNode};
