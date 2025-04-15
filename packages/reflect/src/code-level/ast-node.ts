import type { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ArrayTypeNode, CommentTypeElement, Expression, Identifier, ImportDeclaration, JSDoc, Node, StringLiteral, TypeAliasDeclaration, TypeLiteralNode, TypeReferenceNode } from "ts-morph";

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

export type TypeDeclaration = {[key: string]: ValueType};

/**
 * identity -> AstNode or
 * identity -> AraLink to another identity
 */
export type AstIdentifiers = {[key: string]: AstNode|AraLink<string>};

export type ValueType = string | number | Array<any> | Object | boolean | EnumMembers | AraLink<any> | TypeDeclaration;

export type IdentifiedNodeDataType = ValueTypeString | AraLink<ValueType>;

export class AstNode {
    nodeType?: AstNodeType;
    constant?: boolean;
    public?: boolean;   // If the module exposes it
    dataType?: IdentifiedNodeDataType;    // Identify the value in the future
    data?: ValueType;
    importPath?: AraLink<ValueType>;    // the import identifier
    identifier?: string;              // If the ast node has an alias, then alias is the second parameter
    private _tsNode: Node;

    public get tsNode(): Node {
        return this._tsNode;
    }

    private constructor(tsNode: Node) {
        this._tsNode = tsNode;
    }

    public static fromTsNode(tsNode: Node): AstNode {
        const astNode = new AstNode(tsNode);
        return astNode;
    }

    //----------------------------------------------------------
    //
    // Traits
    //
    //----------------------------------------------------------
    public isImportedNode = (): boolean => {
        return (this.importPath !== undefined)
    }

    public getImportModulePath = (): string|undefined => {
        if (!this.isImportedNode()) {
            return undefined;
        }

        return this.importPath!.resource as string;
    }

    /**
     * Returns the children that are not ${skipKeywords} and not passes the filter.
     * @param skipFilters 
     * @param skipKeywords 
     * @returns 
     */
    public getChildren = (includeFilters?: ((child: Node) => boolean)[], skipFilters?: ((child: Node) => boolean)[], skipKeywords?: string[]): AstNode[] => {
        const children = this._tsNode.getChildren();
        const astNodes: AstNode[] = [];

        for (let child of children) {
            if (includeFilters !== undefined) {
                let unfiltered = false;
                for (let filter of includeFilters) {
                    if (!filter(child)) {
                        unfiltered = true;
                        break;
                    }
                }

                if (unfiltered) {
                    continue;
                }
            }
            
            if (skipFilters !== undefined) {
                let filtered = false;
                for (let filter of skipFilters) {
                    if (filter(child)) {
                        filtered = true;
                        break;
                    }
                }

                if (filtered) {
                    continue;
                }
            }

            if (skipKeywords !== undefined) {
                if (AstNode.isKeyword(child, skipKeywords)) {
                    continue;
                }
            }

            astNodes.push(AstNode.fromTsNode(child))
        }

        return astNodes;
    }

    //----------------------------------------------------------
    //
    // Pure Ast node work, therefore static methods.
    //
    //----------------------------------------------------------

    public static isImportedNode = (child: AstNode): boolean => {
        return (child.importPath !== undefined)
    }

    
    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child 
     * @returns {boolean}
     */
    public static isNonImportantNode = (child: Node): boolean => {
        if (child instanceof JSDoc) {
            return true;
        } else if (child instanceof CommentTypeElement) {
            return true;
        } else if (child.getText() === ";") {
            return true;
        }

        return false;
    }

    /**
     * Is the node in AST is one of the identifiers you pass
     * @param child 
     * @param identifiers 
     * @returns 
     */
    public static isKeyword = (child: Node, identifier: string[]|string): boolean => {
        return identifier.indexOf(child.getText()) > -1;
    }

    public static isExportKeyword = (child: Node): boolean => {
        return AstNode.isKeyword(child, "export");
    }

    public static isConstKeyword = (child: Node): boolean => {
        return AstNode.isKeyword(child, "const");
    }

    public static isTypeKeyword = (child: Node): boolean => {
        return AstNode.isKeyword(child, "type");
    }

    public static isAsKeyword = (child: Node): boolean => {
        return AstNode.isKeyword(child, "as");
    }

    public static isIdentifier = (child: Node): boolean => {
        return child instanceof Identifier;
    }

    public static isString = (child: Node): boolean => {
        return child instanceof StringLiteral;
    }

    public static isImportDeclaration = (child: Node): boolean => {
        return child instanceof ImportDeclaration;
    }

    public static isTypeDeclaration = (child: Node): boolean => {
        return child instanceof TypeAliasDeclaration
    }

    public static isExpression = (child: Node): boolean => {
        return child instanceof Expression
    }

    public static isTypeRef = (child: Node): boolean => {
        return child instanceof TypeReferenceNode;
    }

    public static isTypeLiteral = (child: Node): boolean => {
        return child instanceof TypeLiteralNode;
    }

    public static isArrayTypeDeclaration = (child: Node): boolean => {
        return child instanceof ArrayTypeNode
    }
}
