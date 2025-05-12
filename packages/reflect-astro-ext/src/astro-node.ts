import type { 
    ComponentNode, 
    ElementNode, 
    ExpressionNode, 
    TextNode, 
    Node, 
    AttributeNode 
} from "@astrojs/compiler/types";
import { Result, StringTraits } from "@ara-web/p-hintjens";

type SupportedAstroNode = ElementNode | ExpressionNode | ComponentNode | TextNode;
const isSupportedAstroNode = (node: Node): boolean => {
    return node.type === "component" || 
    node.type === "element" || 
    node.type === "expression" || 
    node.type === "text"
}

export class AstroNode {
    private _node: SupportedAstroNode;

    private constructor(node: SupportedAstroNode) {
        this._node = node;
    }

    public get name(): string {
        return AstroNode.nodeName(this._node);
    }

    public get value(): string {
        return AstroNode.nodeValue(this._node);
    }

    /**
     * Returns child nodes if they are supported by Astro Reflect.
     * Unsupported nodes will be omitted.
     */
    public get children(): AstroNode[] {
        const nodes: AstroNode[] = [];
        const rawNodes = AstroNode.nodeChildren(this._node);
        if (rawNodes.length === 0) {
            return [];
        }

        for (const rawNode of rawNodes) {
            const astroNode = AstroNode.newFromNode(rawNode);
            if (astroNode.isFailure) {
                continue;
            }

            nodes.push(astroNode.getValue());
        }

        return nodes;
    }

    public get attributes(): AttributeNode[] {
        return AstroNode.nodeAttributes(this._node);
    }

    public setAttributes(attrs: AttributeNode[]) {
        if (!("attributes" in this._node)) {
            Object.assign(this._node, {"attributes": attrs})
        } else {
            this._node.attributes = attrs;
        }
    }

    public get isComponent (): boolean {
        return this._node.type === "component";
    }

    public get isHTMLElement (): boolean {
        return this._node.type === "element";
    }

    public get isExpression (): boolean {
        return this._node.type === "expression";
    }

    public get isText (): boolean {
        return this._node.type === "text";
    }

    public static isSupportedNode = (node: Node): boolean => {
        return isSupportedAstroNode(node);
    }

    public static nodeValue = (node: Node): string => {
        if ("value" in node) {
            return node.value.trim();
        }

        return "";
    }

    public static nodeChildren = (node: Node): Node[] => {
        if ("children" in node) {
            return node.children;
        }

        return [];
    }

    public static nodeName = (node: Node): string => {
        if ("name" in node) {
            return node.name;
        }

        return StringTraits.capitalizeFirstLetter(node.type);
    }

    public static newFromNode(node: Node): Result<AstroNode> {
        if (!this.isSupportedNode(node)) {
            return Result.fail(`this.isSupportedNode(): not supported`, `The ${this.nodeName(node)} not supported yet, update Ontology`)
        }

        const astroNode = new AstroNode(node as SupportedAstroNode);
        return Result.ok(astroNode)
    }

    public static nodeAttributes = (node: Node): AttributeNode[] => {
        if ("attributes" in node) {
            return node.attributes;
        }

        return [];
    }
}
