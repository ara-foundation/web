import { CommentTypeElement, Expression, JSDoc, Node, PropertySignature, StringLiteral, SyntaxList, } from "ts-morph";
export class AstNodeTraits {
    static GenericNodeLength = 3;
    static isChildExist(tsNode, index) {
        return (index >= 0 && index < tsNode.getChildCount());
    }
    /**
     * Returns the children.
     * @param skipFilters
     * @param skipKeywords
     * @returns
     */
    static getChildren = (tsNode, includeFilters, skipFilters, skipKeywords) => {
        const nodes = [];
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
            nodes.push(child);
        }
        return nodes;
    };
    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child
     * @returns {boolean}
     */
    static isNonImportant = (tsNode) => {
        if (tsNode instanceof JSDoc) {
            return true;
        }
        else if (tsNode instanceof CommentTypeElement) {
            return true;
        }
        else if (tsNode.getText() === ";") {
            return true;
        }
        return false;
    };
    /**
     * Is the node in AST is one of the identifiers you pass
     * @param child
     * @param identifiers
     * @returns
     */
    static isKeyword = (tsNode, identifier) => {
        if (typeof identifier === "string") {
            return tsNode.getText() === identifier;
        }
        return identifier.includes(tsNode.getText());
    };
    static isExportKeyword = (tsNode) => {
        return this.isKeyword(tsNode, "export");
    };
    static isConstKeyword = (tsNode) => {
        return this.isKeyword(tsNode, "const");
    };
    static isTypeKeyword = (tsNode) => {
        return this.isKeyword(tsNode, "type");
    };
    static isAsKeyword = (tsNode) => {
        return this.isKeyword(tsNode, "as");
    };
    static isString = (tsNode) => {
        return tsNode instanceof StringLiteral;
    };
    static isExpression = (child) => {
        return child instanceof Expression;
    };
    static isSyntaxList = (child) => {
        return child instanceof SyntaxList;
    };
    static isPropertySignature = (child) => {
        return child instanceof PropertySignature;
    };
}
