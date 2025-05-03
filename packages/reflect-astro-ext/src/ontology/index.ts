import type { ComponentNode, ElementNode, ExpressionNode, TextNode, Node, AttributeNode } from "@astrojs/compiler/types";
import { type ModuleLink, Result, StringTraits } from "@ara-web/p-hintjens";
import { 
    FileExtension as BaseExtension, 
    ModuleMemory 
} from "@ara-web/reflect";
import type { ReflectLink } from "@ara-web/reflect/code-level";

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

/**
 * Any UI Content is composed of the HTML Elements and the source code
 */
export type ModuleParts = {
    fileExtension: FileExtension,
    elements?: AstroNode[],             // Change to the generic to support react.
    source?: string,
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OntologicalNormalMethods {}

export interface OntologoicalIdentifier {
    new(): OntologicalNormalMethods;

    /**
     * Generates the JSON Ontological elements from the module `parts` and module `memory`.
     * @param {Parts} parts 
     * @returns {Component}
     */
    identify: <T>(parts: ModuleParts, memory: ModuleMemory<T>) => Promise<Result<T>>;
}

/**
 * List of file extensions Astro Framework Reflection could reflect.
 */
export enum FileExtension {
    Astro = ".astro",
    Svg = ".svg",
    Markdown = ".md",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = BaseExtension.Typescript,
    Javascript = BaseExtension.Javascript,
}
export const DEFAULT_SLOT = 'default'

export enum ElementType {
    Page,
    Layout,
    Component,
    Expression,
    Script,     // Anything in the scripts
    // For example Images, Markdown files
    Asset,      // Anything provided as it is, and not parsable as ontological data yet. Perhaps use AI for it?
}

export type Meta = {
    title: string;
    description: string;
}

export type SlotElement = Component | Expression | Text

export type Slots = {
    [key: string]: SlotElement[];
}

/**
 * Script
 */
export type Module = Meta & {
    moduleLink: ModuleLink
    fileExtension: FileExtension;
    get: unknown;
    type: ElementType.Script;
    source?: string;             // Source code of the script as it is.
}

/**
 * Asset is anything but ModuleCategory. Intended to keep data that were not parsable.
 * For example graphical or audio files, config files.
 * 
 * Optionally, if the asset data is in text format, then holds the data in the source.
 */
export type Asset = Omit<Module, "type" | "source"> & {
    type: ElementType.Asset;
    source?: string
}

export type Attributes = Record<string, ReflectLink|string>;

export type Component = {
    class: ModuleLink;
    url: string;
    slots: Slots;
    get: unknown;
    attributes: Attributes;
}

export type Expression = Omit<Component, "attributes" | "class"> & {
    prefix: string;
    suffix: string;
}

export type Text = Omit<Component, "attributes" | "class" | "slots"> & {
    value: string;
}

export type Page = Omit<Component, "class" | "url" | "get" | "attributes"> & Omit<Module, "type" > & {
};
