import { 
    CommentTypeElement, 
    Expression, 
    JSDoc, 
    Node, 
    PropertySignature, 
    StringLiteral, 
    SyntaxList, 
} from "ts-morph";


/**
 * A method type to define method that validates the `Node`.
 * Use this module to when creating various Ast Parser modules to filter the necessary data for
 * your need.
 */
export type AstNodeFilter = (node: Node) => boolean;

export class AstNodeTraits {
    public static readonly GenericNodeLength = 3;

    public static isChildExist(tsNode: Node, index: number): boolean {
        return (index >= 0 && index < tsNode.getChildCount());
    }

    /**
     * Returns the children.
     * @param skipFilters 
     * @param skipKeywords 
     * @returns 
     */
    public static getChildren = (
        tsNode: Node,
        includeFilters?: AstNodeFilter[], 
        skipFilters?: AstNodeFilter[], 
        skipKeywords?: string[]
    ): Node[] => {
        const nodes: Node[] = [];
        const children = tsNode.getChildren();

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
                if (AstNodeTraits.isKeyword(child, skipKeywords)) {
                    continue;
                }
            }

            nodes.push(child)
        }

        return nodes;
    }

    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child 
     * @returns {boolean}
     */
    public static isNonImportant = (tsNode: Node): boolean => {
        if (tsNode instanceof JSDoc) {
            return true;
        } else if (tsNode instanceof CommentTypeElement) {
            return true;
        } else if (tsNode.getText() === ";") {
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
    public static isKeyword = (tsNode: Node, identifier: string[]|string): boolean => {
        if (typeof identifier === "string") {
            return tsNode.getText() === identifier;
        }

        return identifier.includes(tsNode.getText());
    }

    public static isExportKeyword = (tsNode: Node): boolean => {
        return this.isKeyword(tsNode, "export");
    }

    public static isConstKeyword = (tsNode: Node): boolean => {
        return this.isKeyword(tsNode, "const");
    }

    public static isTypeKeyword = (tsNode: Node): boolean => {
        return this.isKeyword(tsNode, "type");
    }

    public static isAsKeyword = (tsNode: Node): boolean => {
        return this.isKeyword(tsNode, "as");
    }

    public static isString = (tsNode: Node): boolean => {
        return tsNode instanceof StringLiteral;
    }

    public static isExpression = (child: Node): boolean => {
        return child instanceof Expression
    }

    public static isSyntaxList = (child: Node): boolean => {
        return child instanceof SyntaxList;
    }

    public static isPropertySignature = (child: Node): boolean => {
        return child instanceof PropertySignature;
    }
}
