import { Result, StringTraits } from "@ara-web/ts-enhancement";
import { FileExtension as BaseExtension, ModuleMemory } from "@ara-web/reflect";
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
        for (let rawNode of rawNodes) {
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
/**
 * List of file extensions Astro Framework Reflection could reflect.
 */
export var FileExtension;
(function (FileExtension) {
    FileExtension["Astro"] = ".astro";
    FileExtension["Svg"] = ".svg";
    FileExtension["Markdown"] = ".md";
    FileExtension["Tsx"] = ".tsx";
    FileExtension["Jsx"] = ".jsx";
    FileExtension["Typescript"] = ".ts";
    FileExtension["Javascript"] = ".js";
})(FileExtension || (FileExtension = {}));
export const DEFAULT_SLOT = 'default';
export var ElementType;
(function (ElementType) {
    ElementType[ElementType["Page"] = 0] = "Page";
    ElementType[ElementType["Layout"] = 1] = "Layout";
    ElementType[ElementType["Component"] = 2] = "Component";
    ElementType[ElementType["Expression"] = 3] = "Expression";
    ElementType[ElementType["Script"] = 4] = "Script";
    // For example Images, Markdown files
    ElementType[ElementType["Asset"] = 5] = "Asset";
})(ElementType || (ElementType = {}));
