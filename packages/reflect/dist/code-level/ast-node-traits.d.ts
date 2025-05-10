import { Node } from "ts-morph";
/**
 * A method type to define method that validates the `TsNode`.
 * Use this module to when creating various Ast Parser modules to filter the necessary data for
 * your need.
 */
export type AstNodeFilter = (node: Node) => boolean;
export declare class AstNodeTraits {
    static readonly GenericNodeLength = 3;
    static isChildExist(tsNode: Node, index: number): boolean;
    /**
     * Returns the children.
     * @param skipFilters
     * @param skipKeywords
     * @returns
     */
    static getChildren: (tsNode: Node, includeFilters?: AstNodeFilter[], skipFilters?: AstNodeFilter[], skipKeywords?: string[]) => Node[];
    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child
     * @returns {boolean}
     */
    static isNonImportant: (tsNode: Node) => boolean;
    /**
     * Is the node in AST is one of the identifiers you pass
     * @param child
     * @param identifiers
     * @returns
     */
    static isKeyword: (tsNode: Node, identifier: string[] | string) => boolean;
    static isExportKeyword: (tsNode: Node) => boolean;
    static isConstKeyword: (tsNode: Node) => boolean;
    static isTypeKeyword: (tsNode: Node) => boolean;
    static isAsKeyword: (tsNode: Node) => boolean;
    static isString: (tsNode: Node) => boolean;
    static isExpression: (child: Node) => boolean;
    static isSyntaxList: (child: Node) => boolean;
    static isPropertySignature: (child: Node) => boolean;
}
