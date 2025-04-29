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
 * A method type to define method that validates the `TsNode`.
 * Use this module to when creating various Ast Parser modules to filter the necessary data for
 * your need.
 */
export type TsNodeValidator = (node: TsNode) => boolean;

export class TsNode {
    public static readonly GenericNodeLength = 3;

    protected _tsNode: Node;

    public constructor(tsNode: Node|TsNode) {
        if (tsNode === undefined) {
            throw new Error(`TSNode recevied undefined instead ts-morph<Node> or TsNode`)
        }
        if (tsNode instanceof TsNode) {
            this._tsNode = tsNode._tsNode;
        } else {
            this._tsNode = tsNode;
        }
    }

    public getText = (): string => {
        return this._tsNode.getText();
    }

    public getNode<T = Node>(): T {
        return this._tsNode as T;
    }

    /**
     * If this TsNode has a sibling in the Ast Tree, then return it
     */
    public getNextSibling(): TsNode|undefined {
        const nextNode = this._tsNode.getNextSibling();
        if (nextNode === undefined) {
            return nextNode;
        }

        return new TsNode(nextNode);
    }

    public isChildExist(index: number): boolean {
        if (index < 0) {
            return false;
        }
        const childCount = this._tsNode.getChildCount();

        return index + 1 <= childCount;
    }

    public getChild(index: number): TsNode|undefined {
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
    public getChildren = (
        includeFilters?: TsNodeValidator[], 
        skipFilters?: TsNodeValidator[], 
        skipKeywords?: string[]
    ): TsNode[] => {
        const nodes: TsNode[] = [];
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

            nodes.push(node)
        }

        return nodes;
    }

    /**
     * Is the node in AST is not important part of the code?
     * Such as `;` command separator, or a comment
     * @param child 
     * @returns {boolean}
     */
    public static isNonImportant = (tsNode: TsNode): boolean => {
        if (tsNode._tsNode instanceof JSDoc) {
            return true;
        } else if (tsNode._tsNode instanceof CommentTypeElement) {
            return true;
        } else if (tsNode._tsNode.getText() === ";") {
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
    public static isKeyword = (tsNode: TsNode, identifier: string[]|string): boolean => {
        if (typeof identifier === "string") {
            return tsNode.getText() === identifier;
        }

        return identifier.includes(tsNode._tsNode.getText());
    }

    public static isExportKeyword = (tsNode: TsNode): boolean => {
        return TsNode.isKeyword(tsNode, "export");
    }

    public static isConstKeyword = (tsNode: TsNode): boolean => {
        return TsNode.isKeyword(tsNode, "const");
    }

    public static isTypeKeyword = (tsNode: TsNode): boolean => {
        return TsNode.isKeyword(tsNode, "type");
    }

    public static isAsKeyword = (tsNode: TsNode): boolean => {
        return TsNode.isKeyword(tsNode, "as");
    }

    public static isString = (tsNode: TsNode): boolean => {
        return tsNode._tsNode instanceof StringLiteral;
    }

    public static isExpression = (child: TsNode): boolean => {
        return child._tsNode instanceof Expression
    }

    public static isSyntaxList = (child: TsNode): boolean => {
        return child._tsNode instanceof SyntaxList;
    }

    public static isPropertySignature = (child: TsNode): boolean => {
        return child._tsNode instanceof PropertySignature;
    }
}
