import { Node } from "ts-morph";
/**
 * A method type to define method that validates the `TsNode`.
 * Use this module to when creating various Ast Parser modules to filter the necessary data for
 * your need.
 */
export type TsNodeValidator = (node: TsNode) => boolean;
export declare class TsNode {
    static readonly GenericNodeLength = 3;
    protected _tsNode: Node;
    constructor(tsNode: Node | TsNode);
    getText: () => string;
    getNode<T = Node>(): T;
    /**
     * If this TsNode has a sibling in the Ast Tree, then return it
     */
    getNextSibling(): TsNode | undefined;
    isChildExist(index: number): boolean;
    getChild(index: number): TsNode | undefined;
    /**
     * Returns the children.
     * @param skipFilters
     * @param skipKeywords
     * @returns
     */
    getChildren: (includeFilters?: TsNodeValidator[], skipFilters?: TsNodeValidator[], skipKeywords?: string[]) => TsNode[];
    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child
     * @returns {boolean}
     */
    static isNonImportant: (tsNode: TsNode) => boolean;
    /**
     * Is the node in AST is one of the identifiers you pass
     * @param child
     * @param identifiers
     * @returns
     */
    static isKeyword: (tsNode: TsNode, identifier: string[] | string) => boolean;
    static isExportKeyword: (tsNode: TsNode) => boolean;
    static isConstKeyword: (tsNode: TsNode) => boolean;
    static isTypeKeyword: (tsNode: TsNode) => boolean;
    static isAsKeyword: (tsNode: TsNode) => boolean;
    static isString: (tsNode: TsNode) => boolean;
    static isExpression: (child: TsNode) => boolean;
    static isSyntaxList: (child: TsNode) => boolean;
    static isPropertySignature: (child: TsNode) => boolean;
}
