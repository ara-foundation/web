import { AraLink, ModuleLink, Result } from "@ara-web/p-hintjens";
import type { TsNode } from "./ts-node.js";
import type { IdentifiedNodeDataType, ValueType } from "./ast-node-data.js";

export enum AstNodeType {
    Variable = "variable",
    Enum = "enum",
    Function = "function",
    Class = "class",
    Object = "object",
    Property = "property",
    Type = "type",
    Array= "array",
    Literal = "literal",
}

/**
 * identity -> AstNode or
 * identity -> AraLink to another identity
 */
export type AstIdentifiers = {[key: string]: AstNode};

export type AstNodeValidator = (astNode: AstNode) => boolean;

// If the AST Node has generic values in typescript it's between < and >.
export type GenericHandler = (astNode: AstNode, values: ValueType[]) => Result<AstNode>;

export type TypedData = Pick<AstNode, "data" | "dataType">

export class AstNode {
    public static readonly GenericNodeLength = 3;

    public nodeType?: AstNodeType;
    public constant?: boolean;
    public public?: boolean;   // If the module exposes it
    public dataType?: IdentifiedNodeDataType;    // Identify the value in the future
    public data?: ValueType;
    public importPath?: ModuleLink;    // the import identifier
    public identifier?: string;              // If the ast node has an alias, then alias is the second parameter
    // If the ast node has a Generic Handler, then use this function to overwrite
    private _genericHandler?: GenericHandler;
    private _nodeMemory?: AstNode[];                  // Anything defined and available within the Ast Node, means ast data
    private _tsNode: TsNode;

    public get tsNode(): TsNode {
        return this._tsNode;
    }

    protected constructor(tsNode: TsNode) {
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

    public get typedData(): TypedData {
        return {...{
            data: this.data,
            dataType: this.dataType
        }}
    }

    public set typedData(_typedData: TypedData) {
        this.data = _typedData.data;
        this.dataType = _typedData.dataType;
    }
    
    public get isGenericHandlerExist(): boolean {
        return this._genericHandler !== undefined;
    }

    public handleGeneric  = (genericValues: ValueType[]): Result<AstNode> => {
        if (!this.isGenericHandlerExist) {
            return Result.fail(
                `this.isGenericHandlerExist: not found`,
                `Please call this.putGenericHandler() before`
            )
        }

        const result = this._genericHandler!(this, genericValues)
        if (result.isFailure) {
            return Result.fail(
                `this.genericHandler(): ${result.errorTitle}`,
                result.errorDescription!
            )
        }

        return Result.ok(result.getValue())
    }
    
    public putGenericHandler = (genericHandler: GenericHandler): void => {
        this._genericHandler = genericHandler;
    }
    
    public putMemoryData(astNode: AstNode): void {
        if (this._nodeMemory === undefined) {
            this._nodeMemory = [astNode];
            return;
        }

        this._nodeMemory.push(astNode);
    }

    public postMemoryData(index: number, astNode?: AstNode): void {
        if (this._nodeMemory === undefined) {
            if (astNode !== undefined) {
                this._nodeMemory = [astNode];
            } else {
                this._nodeMemory = [];
            }
        } else {
            if (astNode !== undefined) {
                this._nodeMemory[index] = astNode;
            } else {
                delete this._nodeMemory[index];
            }
        }
    }

    public memoryDataLength(): number {
        if (this._nodeMemory === undefined) {
            return 0;
        }
        return this._nodeMemory.length;
    }

    public getAllMemoryData(skippedIdentifiers?: string[]): AstNode[] {
        if (this._nodeMemory === undefined) {
            return []
        }

        if (skippedIdentifiers === undefined) {
            return this._nodeMemory;
        }
        const nodes: AstNode[] = [];

        for (let node of this._nodeMemory) {
            if (node.identifier === undefined) {
                continue;
            }
            if (skippedIdentifiers.includes(node.identifier)) {
                continue;
            }
            nodes.push(node);
        }

        return nodes;
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

    public deleteMemoryData(index?: number): boolean {
        if (index === undefined) {
            this._nodeMemory = undefined;
            return true;
        }

        if (index < 0 || index >= this.memoryDataLength()) {
            return false;
        }

        this._nodeMemory = this._nodeMemory?.filter((_, nodeIndex) => (nodeIndex !== index));
        return true;
    }

    //----------------------------------------------------------
    //
    // Pure Ast node work, therefore static methods.
    //
    //----------------------------------------------------------

    public static isDefinedInOtherModule: AstNodeValidator = (child: AstNode): boolean => {
        return (child.importPath !== undefined)
    }

    public static isDefinedInLocal: AstNodeValidator = (child: AstNode): boolean => {
        return (child.importPath === undefined)
    }

    public static isDataNotEmpty: AstNodeValidator = (child: AstNode): boolean => {
        if (child.data === undefined) {
            return false;
        }

        if (child.data instanceof AraLink) {
            return true;
        }
        if (Array.isArray(child.data)) {
            return (child.data.length > 0);
        }
        if (typeof child.data !== "object") {
            return false;
        }

        return Object.keys(child.data).length > 0
    }

    public static isDataLink: AstNodeValidator = (child: AstNode): boolean => {
        if (child.data === undefined) {
            return false;
        }

        return child.data instanceof AraLink;
    }

    public static isTypeDeclaration: AstNodeValidator = (child: AstNode): boolean => {
        return (child.nodeType === AstNodeType.Type);
    }

    public static isVariableDeclaration: AstNodeValidator = (child: AstNode): boolean => {
        return (child.nodeType === AstNodeType.Variable);
    }
}
