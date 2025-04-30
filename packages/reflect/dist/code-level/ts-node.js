import { CommentTypeElement, Expression, JSDoc, Node, PropertySignature, StringLiteral, SyntaxList, } from "ts-morph";
export class TsNode {
    static GenericNodeLength = 3;
    _tsNode;
    constructor(tsNode) {
        if (tsNode === undefined) {
            throw new Error(`TSNode recevied undefined instead ts-morph<Node> or TsNode`);
        }
        if (tsNode instanceof TsNode) {
            this._tsNode = tsNode._tsNode;
        }
        else {
            this._tsNode = tsNode;
        }
    }
    getText = () => {
        return this._tsNode.getText();
    };
    getNode() {
        return this._tsNode;
    }
    /**
     * If this TsNode has a sibling in the Ast Tree, then return it
     */
    getNextSibling() {
        const node = this._tsNode.getNextSibling();
        return node === undefined ? undefined : new TsNode(node);
    }
    getPreviousSibling() {
        const node = this._tsNode.getPreviousSibling();
        return node === undefined ? undefined : new TsNode(node);
    }
    isChildExist(index) {
        if (index < 0) {
            return false;
        }
        const childCount = this._tsNode.getChildCount();
        return index + 1 <= childCount;
    }
    getChild(index) {
        const child = this._tsNode.getChildAtIndex(index);
        const node = new TsNode(child);
        return node;
    }
    /**
     * Returns the children.
     * @param skipFilters
     * @param skipKeywords
     * @returns
     */
    getChildren = (includeFilters, skipFilters, skipKeywords) => {
        const nodes = [];
        const children = this._tsNode.getChildren();
        for (let child of children) {
            if (includeFilters !== undefined) {
                let unfiltered = false;
                for (let filter of includeFilters) {
                    if (!filter(new TsNode(child))) {
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
                    if (filter(new TsNode(child))) {
                        filtered = true;
                        break;
                    }
                }
                if (filtered) {
                    continue;
                }
            }
            const node = new TsNode(child);
            if (skipKeywords !== undefined) {
                if (TsNode.isKeyword(node, skipKeywords)) {
                    continue;
                }
            }
            nodes.push(node);
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
        if (tsNode._tsNode instanceof JSDoc) {
            return true;
        }
        else if (tsNode._tsNode instanceof CommentTypeElement) {
            return true;
        }
        else if (tsNode._tsNode.getText() === ";") {
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
        return identifier.includes(tsNode._tsNode.getText());
    };
    static isExportKeyword = (tsNode) => {
        return TsNode.isKeyword(tsNode, "export");
    };
    static isConstKeyword = (tsNode) => {
        return TsNode.isKeyword(tsNode, "const");
    };
    static isTypeKeyword = (tsNode) => {
        return TsNode.isKeyword(tsNode, "type");
    };
    static isAsKeyword = (tsNode) => {
        return TsNode.isKeyword(tsNode, "as");
    };
    static isString = (tsNode) => {
        return tsNode._tsNode instanceof StringLiteral;
    };
    static isExpression = (child) => {
        return child._tsNode instanceof Expression;
    };
    static isSyntaxList = (child) => {
        return child._tsNode instanceof SyntaxList;
    };
    static isPropertySignature = (child) => {
        return child._tsNode instanceof PropertySignature;
    };
}
