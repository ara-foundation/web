import { AraLink } from "@ara-web/ara-link";

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

export type ValueType = string | number | Array<any> | Object | boolean | EnumMembers | AraLink<any> | TypeDeclaration;

export type IdentifiedNodeDataType = ValueTypeString | AraLink<ValueType>;

export type IdentifiedNode = {
    nodeType: AstNodeType,
    constant?: boolean,
    public?: boolean;   // If the module exposes it
    dataType?: IdentifiedNodeDataType,    // Identify the value in the future
    data?: ValueType,
    importPath?: AraLink<ValueType>,    // the import identifier
    identifier?: string,
}

export type TypeDeclaration = {[key: string]: ValueType};

export type Identifiers = {[key: string]: IdentifiedNode};
