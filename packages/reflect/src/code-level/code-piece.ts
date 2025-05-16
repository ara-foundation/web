import { Node } from "ts-morph"
import { AraLink, ModuleLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import type { IdentifiedNodeDataType, ValueType } from "./code-piece-types.js";

export enum CodePieceType {
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
export type CodePieceRecord = Record<string, CodePiece>;

export type CodePieceFilter = (astNode: CodePiece) => boolean;

// If the AST Node has generic values in typescript it's between < and >.
export type GenericHandler = (astNode: CodePiece, values: ValueType[]) => Result<CodePiece>;

export type TypedData = Pick<CodePiece, "data" | "dataType">

export class CodePiece {
    public static readonly GenericNodeLength = 3;

    public nodeType?: CodePieceType;
    public constant?: boolean;
    public public?: boolean;   // If the module exposes it
    public dataType?: IdentifiedNodeDataType;    // Identify the value in the future
    public data?: ValueType;
    public importPath?: ModuleLink;    // the import identifier
    public identifier?: string;              // If the ast node has an alias, then alias is the second parameter
    // If the ast node has a Generic Handler, then use this function to overwrite
    private _genericHandler?: GenericHandler;
    private _nodeMemory?: CodePiece[];                  // Anything defined and available within the Ast Node, means ast data
    private _tsNode: Node;

    public get tsNode(): Node {
        return this._tsNode;
    }

    // So that people won't create an instance of this class
    // directly, but use the static method instead.
    // Because most of the methods are depending on the node.
    protected constructor(tsNode: Node) {
        this._tsNode = tsNode;
    }

    public static fromTsNode(tsNode: Node): CodePiece {
        const astNode = new CodePiece(tsNode);
        return astNode;
    }

    public isObjectBinding(): boolean {
        if (this.memoryDataLength() > 0) {
            return this.getMemoryData(0)?.nodeType === CodePieceType.Property;
        }
        return false;
    }

    public getBindedObject(): CodePiece|undefined {
        if (this.isObjectBinding()) {
            return this.getMemoryData(0);
        }
    }

    public putBindedObjectData(data: ValueType): void {
        if (this._nodeMemory !== undefined && this._nodeMemory.length > 0) {
            this._nodeMemory[0].data = data;
        }
    }

    //----------------------------------------------------------
    //
    // Typed Data (data and dataType)
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

    //----------------------------------------------------------
    //
    // Generic Handler (In typescript, the generic type is between < and >)
    // Array<string> or CustomType<Node>
    //----------------------------------------------------------
    
    public get isGenericHandlerExist(): boolean {
        return this._genericHandler !== undefined;
    }

    public handleGeneric = (genericValues: ValueType[]): Result<CodePiece> => {
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
    
    //----------------------------------------------------------
    //
    // Internal memory of the AST node.
    // For example, additional internal ast nodes for example generic values
    // is assigned here.
    //
    // TODO: use the @ara-web/p-hintjens/rest
    //
    //----------------------------------------------------------

    /**
     * Put internal memory. Wrong, it should be postMemory.
     * @param astNode 
     * @returns 
     */
    public putMemoryData(astNode: CodePiece): void {
        if (this._nodeMemory === undefined) {
            this._nodeMemory = [astNode];
            return;
        }

        this._nodeMemory.push(astNode);
    }

    /**
     * Post internal memory data. it should be putMemmory.
     * @param index 
     * @param astNode 
     */
    public postMemoryData(index: number, astNode?: CodePiece): void {
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

    /**
     * How many internal memory data is assigned to this node?
     * @returns 
     */
    public memoryDataLength(): number {
        if (this._nodeMemory === undefined) {
            return 0;
        }
        return this._nodeMemory.length;
    }

    /**
     * Return all the internal memory data except {@link skippedIdentifiers}.
     * @param skippedIdentifiers 
     * @returns 
     */
    public getAllMemoryData(skippedIdentifiers?: string[]): CodePiece[] {
        if (this._nodeMemory === undefined) {
            return []
        }

        if (skippedIdentifiers === undefined) {
            return this._nodeMemory;
        }
        const nodes: CodePiece[] = [];

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

    /**
     * Get the memory data by index.
     * @param index 
     * @returns 
     */
    public getMemoryData(index: number): CodePiece|undefined {
        if (index < 0) {
            return undefined;
        }
        if (this._nodeMemory === undefined || this._nodeMemory.length <= index) {
            return undefined;
        }
        return this._nodeMemory[index];
    }

    /**
     * Delete the memory data by index.
     * @param index 
     * @returns 
     */
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

    /**
     * This node was defined in another module, therefore it has an import path.
     * @param child 
     * @returns 
     */
    public static isDefinedInOtherModule: CodePieceFilter = (child: CodePiece): boolean => {
        return (child.importPath !== undefined)
    }

    /**
     * This node was defined in the same module, therefore it has no import path.
     * @param child 
     * @returns 
     */
    public static isDefinedInLocal: CodePieceFilter = (child: CodePiece): boolean => {
        return (child.importPath === undefined)
    }

    /**
     * This node has a data? It can't be literal value.
     * It must be a link, non-empty array or object.
     * @param child 
     * @returns 
     */
    public static isDataNotEmpty: CodePieceFilter = (child: CodePiece): boolean => {
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

    /**
     * Is node data value is a link to another node?
     * @param child 
     * @returns 
     */
    public static isDataLink: CodePieceFilter = (child: CodePiece): boolean => {
        if (child.data === undefined) {
            return false;
        }

        return child.data instanceof AraLink;
    }

    /**
     * Is it a type declaration?
     * @param child 
     * @returns 
     */
    public static isTypeDeclaration: CodePieceFilter = (child: CodePiece): boolean => {
        return (child.nodeType === CodePieceType.Type);
    }

    /**
     * Is it a variable declaration?
     * @param child 
     * @returns 
     */
    public static isVariableDeclaration: CodePieceFilter = (child: CodePiece): boolean => {
        return (child.nodeType === CodePieceType.Variable);
    }
    
}
