import { Node } from "ts-morph";
import { AraLink, ModuleLink, Result } from "@ara-web/p-hintjens";
export var CodePieceType;
(function (CodePieceType) {
    CodePieceType["Variable"] = "variable";
    CodePieceType["Enum"] = "enum";
    CodePieceType["Function"] = "function";
    CodePieceType["Class"] = "class";
    CodePieceType["Object"] = "object";
    CodePieceType["Property"] = "property";
    CodePieceType["Type"] = "type";
    CodePieceType["Array"] = "array";
    CodePieceType["Literal"] = "literal";
})(CodePieceType || (CodePieceType = {}));
export class CodePiece {
    static GenericNodeLength = 3;
    nodeType;
    constant;
    public; // If the module exposes it
    dataType; // Identify the value in the future
    data;
    importPath; // the import identifier
    identifier; // If the ast node has an alias, then alias is the second parameter
    // If the ast node has a Generic Handler, then use this function to overwrite
    _genericHandler;
    _nodeMemory; // Anything defined and available within the Ast Node, means ast data
    _tsNode;
    get tsNode() {
        return this._tsNode;
    }
    // So that people won't create an instance of this class
    // directly, but use the static method instead.
    // Because most of the methods are depending on the node.
    constructor(tsNode) {
        this._tsNode = tsNode;
    }
    static fromTsNode(tsNode) {
        const astNode = new CodePiece(tsNode);
        return astNode;
    }
    isObjectBinding() {
        if (this.memoryDataLength() > 0) {
            return this.getMemoryData(0)?.nodeType === CodePieceType.Property;
        }
        return false;
    }
    getBindedObject() {
        if (this.isObjectBinding()) {
            return this.getMemoryData(0);
        }
    }
    putBindedObjectData(data) {
        if (this._nodeMemory !== undefined && this._nodeMemory.length > 0) {
            this._nodeMemory[0].data = data;
        }
    }
    //----------------------------------------------------------
    //
    // Typed Data (data and dataType)
    //
    //----------------------------------------------------------
    get typedData() {
        return { ...{
                data: this.data,
                dataType: this.dataType
            } };
    }
    set typedData(_typedData) {
        this.data = _typedData.data;
        this.dataType = _typedData.dataType;
    }
    //----------------------------------------------------------
    //
    // Generic Handler (In typescript, the generic type is between < and >)
    // Array<string> or CustomType<Node>
    //----------------------------------------------------------
    get isGenericHandlerExist() {
        return this._genericHandler !== undefined;
    }
    handleGeneric = (genericValues) => {
        if (!this.isGenericHandlerExist) {
            return Result.fail(`this.isGenericHandlerExist: not found`, `Please call this.putGenericHandler() before`);
        }
        const result = this._genericHandler(this, genericValues);
        if (result.isFailure) {
            return Result.fail(`this.genericHandler(): ${result.errorTitle}`, result.errorDescription);
        }
        return Result.ok(result.getValue());
    };
    putGenericHandler = (genericHandler) => {
        this._genericHandler = genericHandler;
    };
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
    putMemoryData(astNode) {
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
    postMemoryData(index, astNode) {
        if (this._nodeMemory === undefined) {
            if (astNode !== undefined) {
                this._nodeMemory = [astNode];
            }
            else {
                this._nodeMemory = [];
            }
        }
        else {
            if (astNode !== undefined) {
                this._nodeMemory[index] = astNode;
            }
            else {
                delete this._nodeMemory[index];
            }
        }
    }
    /**
     * How many internal memory data is assigned to this node?
     * @returns
     */
    memoryDataLength() {
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
    getAllMemoryData(skippedIdentifiers) {
        if (this._nodeMemory === undefined) {
            return [];
        }
        if (skippedIdentifiers === undefined) {
            return this._nodeMemory;
        }
        const nodes = [];
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
    getMemoryData(index) {
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
    deleteMemoryData(index) {
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
    static isDefinedInOtherModule = (child) => {
        return (child.importPath !== undefined);
    };
    /**
     * This node was defined in the same module, therefore it has no import path.
     * @param child
     * @returns
     */
    static isDefinedInLocal = (child) => {
        return (child.importPath === undefined);
    };
    /**
     * This node has a data? It can't be literal value.
     * It must be a link, non-empty array or object.
     * @param child
     * @returns
     */
    static isDataNotEmpty = (child) => {
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
        return Object.keys(child.data).length > 0;
    };
    /**
     * Is node data value is a link to another node?
     * @param child
     * @returns
     */
    static isDataLink = (child) => {
        if (child.data === undefined) {
            return false;
        }
        return child.data instanceof AraLink;
    };
    /**
     * Is it a type declaration?
     * @param child
     * @returns
     */
    static isTypeDeclaration = (child) => {
        return (child.nodeType === CodePieceType.Type);
    };
    /**
     * Is it a variable declaration?
     * @param child
     * @returns
     */
    static isVariableDeclaration = (child) => {
        return (child.nodeType === CodePieceType.Variable);
    };
}
