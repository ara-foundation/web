import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Debug } from "@ara-web/ts-enhancement";
import type { TsNode } from "./ts-node.js";

export enum AstNodeType {
    Variable = "variable",
    Enum = "enum",
    Function = "function",
    Class = "class",
    Object = "object",
    Type = "type",
    Array= "array",
    Literal = "literal",
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

// Types as objects
export type TypeDeclaration = {[key: string]: ValueType};

/**
 * identity -> AstNode or
 * identity -> AraLink to another identity
 */
export type AstIdentifiers = {[key: string]: AstNode|AraLink<string>};

export type ValueType = string | number | Array<any> | Object | boolean | EnumMembers | AraLink<any> | TypeDeclaration;

export type IdentifiedNodeDataType = ValueTypeString | AraLink<ValueType>;

export type AstNodeValidater = (astNode: AstNode) => boolean;

export class AstNode {
    public static readonly GenericNodeLength = 3;

    public nodeType?: AstNodeType;
    public constant?: boolean;
    public public?: boolean;   // If the module exposes it
    public dataType?: IdentifiedNodeDataType;    // Identify the value in the future
    public data?: ValueType;
    public importPath?: AraLink<ValueType>;    // the import identifier
    public identifier?: string;              // If the ast node has an alias, then alias is the second parameter
    private _nodeMemory?: AstNode[];                  // Anything defined and available within the Ast Node, means ast data
    private _tsNode: TsNode;

    public get tsNode(): TsNode {
        return this._tsNode;
    }

    private constructor(tsNode: TsNode) {
        this._tsNode = tsNode;
    }

    public static fromTsNode(tsNode: TsNode): AstNode {
        const astNode = new AstNode(tsNode);
        return astNode;
    }

    //----------------------------------------------------------
    //
    // Traits
    //
    //----------------------------------------------------------
    public putMemoryData(astNode: AstNode): void {
        if (this._nodeMemory === undefined) {
            this._nodeMemory = [astNode];
            return;
        }

        this._nodeMemory.push(astNode);
    }

    public memoryDataLength(): number {
        if (this._nodeMemory === undefined) {
            return 0;
        }
        return this._nodeMemory.length;
    }

    public getMemoryData(index: number): AstNode|undefined {
        if (index < 0) {
            return undefined;
        }
        if (this._nodeMemory === undefined || this._nodeMemory.length <= index) {
            return undefined;
        }
        return this._nodeMemory[index];
    }

    public deleteMemoryData(): void {
        this._nodeMemory = undefined;
    }

    public getImportModulePath = (): string|undefined => {
        if (!AstNode.isDefinedInOtherModule(this)) {
            return undefined;
        }

        return this.importPath!.resource as string;
    }

    //----------------------------------------------------------
    //
    // Pure Ast node work, therefore static methods.
    //
    //----------------------------------------------------------

    public static isDefinedInOtherModule: AstNodeValidater = (child: AstNode): boolean => {
        return (child.importPath !== undefined)
    }

    public static isDefinedInLocal: AstNodeValidater = (child: AstNode): boolean => {
        return (child.importPath === undefined)
    }

    public static dataIsNonEmptyObject: AstNodeValidater = (child: AstNode): boolean => {
        if (child.data === undefined) {
            return false;
        }

        if (child.data instanceof AraLink) {
            return false;
        }
        if (Array.isArray(child.data)) {
            return false;
        }
        if (typeof child.data !== "object") {
            return false;
        }

        return Object.keys(child.data).length > 0
    }

    public static isTypeDeclaration: AstNodeValidater = (child: AstNode): boolean => {
        return (child.nodeType === AstNodeType.Type);
    }
}
