import { Result, StringTraits } from "@ara-web/p-hintjens";
const isSupportedAstroNode = (node) => {
    return node.type === "component" ||
        node.type === "element" ||
        node.type === "expression" ||
        node.type === "text";
};
export class AstroNode {
    _node;
    constructor(node) {
        this._node = node;
    }
    get name() {
        return AstroNode.nodeName(this._node);
    }
    get value() {
        return AstroNode.nodeValue(this._node);
    }
    /**
     * Returns child nodes if they are supported by Astro Reflect.
     * Unsupported nodes will be omitted.
     */
    get children() {
        const nodes = [];
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
    get attributes() {
        return AstroNode.nodeAttributes(this._node);
    }
    setAttributes(attrs) {
        if (!("attributes" in this._node)) {
            Object.assign(this._node, { "attributes": attrs });
        }
        else {
            this._node.attributes = attrs;
        }
    }
    get isComponent() {
        return this._node.type === "component";
    }
    get isHTMLElement() {
        return this._node.type === "element";
    }
    get isExpression() {
        return this._node.type === "expression";
    }
    get isText() {
        return this._node.type === "text";
    }
    static isSupportedNode = (node) => {
        return isSupportedAstroNode(node);
    };
    static nodeValue = (node) => {
        if ("value" in node) {
            return node.value.trim();
        }
        return "";
    };
    static nodeChildren = (node) => {
        if ("children" in node) {
            return node.children;
        }
        return [];
    };
    static nodeName = (node) => {
        if ("name" in node) {
            return node.name;
        }
        return StringTraits.capitalizeFirstLetter(node.type);
    };
    static newFromNode(node) {
        if (!this.isSupportedNode(node)) {
            return Result.fail(`this.isSupportedNode(): not supported`, `The ${this.nodeName(node)} not supported yet, update Ontology`);
        }
        const astroNode = new AstroNode(node);
        return Result.ok(astroNode);
    }
    static nodeAttributes = (node) => {
        if ("attributes" in node) {
            return node.attributes;
        }
        return [];
    };
}
