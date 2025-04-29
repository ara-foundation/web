import { AraLink, ModuleLink, Result } from "@ara-web/ts-enhancement";
export var AstNodeType;
(function (AstNodeType) {
    AstNodeType["Variable"] = "variable";
    AstNodeType["Enum"] = "enum";
    AstNodeType["Function"] = "function";
    AstNodeType["Class"] = "class";
    AstNodeType["Object"] = "object";
    AstNodeType["Property"] = "property";
    AstNodeType["Type"] = "type";
    AstNodeType["Array"] = "array";
    AstNodeType["Literal"] = "literal";
})(AstNodeType || (AstNodeType = {}));
export class AstNode {
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
    constructor(tsNode) {
        this._tsNode = tsNode;
    }
    static fromTsNode(tsNode) {
        const astNode = new AstNode(tsNode);
        return astNode;
    }
    //----------------------------------------------------------
    //
    // Traits
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
    putMemoryData(astNode) {
        if (this._nodeMemory === undefined) {
            this._nodeMemory = [astNode];
            return;
        }
        this._nodeMemory.push(astNode);
    }
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
    memoryDataLength() {
        if (this._nodeMemory === undefined) {
            return 0;
        }
        return this._nodeMemory.length;
    }
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
    getMemoryData(index) {
        if (index < 0) {
            return undefined;
        }
        if (this._nodeMemory === undefined || this._nodeMemory.length <= index) {
            return undefined;
        }
        return this._nodeMemory[index];
    }
    deleteMemoryData() {
        this._nodeMemory = undefined;
    }
    //----------------------------------------------------------
    //
    // Pure Ast node work, therefore static methods.
    //
    //----------------------------------------------------------
    static isDefinedInOtherModule = (child) => {
        return (child.importPath !== undefined);
    };
    static isDefinedInLocal = (child) => {
        return (child.importPath === undefined);
    };
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
    static isDataLink = (child) => {
        if (child.data === undefined) {
            return false;
        }
        return child.data instanceof AraLink;
    };
    static isTypeDeclaration = (child) => {
        return (child.nodeType === AstNodeType.Type);
    };
}
