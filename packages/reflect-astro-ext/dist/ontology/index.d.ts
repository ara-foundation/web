import type { Node, AttributeNode } from "@astrojs/compiler/types";
import { type ModuleLink, Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import type { ReflectLink } from "@ara-web/reflect/code-level";
export declare class AstroNode {
    private _node;
    private constructor();
    get name(): string;
    get value(): string;
    /**
     * Returns child nodes if they are supported by Astro Reflect.
     * Unsupported nodes will be omitted.
     */
    get children(): AstroNode[];
    get attributes(): AttributeNode[];
    get isComponent(): boolean;
    get isHTMLElement(): boolean;
    get isExpression(): boolean;
    get isText(): boolean;
    static isSupportedNode: (node: Node) => boolean;
    static nodeValue: (node: Node) => string;
    static nodeChildren: (node: Node) => Node[];
    static nodeName: (node: Node) => string;
    static newFromNode(node: Node): Result<AstroNode>;
    static nodeAttributes: (node: Node) => AttributeNode[];
}
/**
 * Any UI Content is composed of the HTML Elements and the source code
 */
export type ModuleParts = {
    fileExtension: FileExtension;
    elements?: AstroNode[];
    source?: string;
};
export interface OntologicalNormalMethods {
}
export interface OntologoicalIdentifier {
    new (): OntologicalNormalMethods;
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
export declare enum FileExtension {
    Astro = ".astro",
    Svg = ".svg",
    Markdown = ".md",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js"
}
export declare const DEFAULT_SLOT = "default";
export declare enum ElementType {
    Page = 0,
    Layout = 1,
    Component = 2,
    Expression = 3,
    Script = 4,// Anything in the scripts
    Asset = 5
}
export type Meta = {
    title: string;
    description: string;
};
export type SlotElement = Component | Expression | Text;
export type Slots = {
    [key: string]: SlotElement[];
};
/**
 * Script
 */
export type Module = Meta & {
    moduleLink: ModuleLink;
    fileExtension: FileExtension;
    get: unknown;
    type: ElementType.Script;
    source?: string;
};
/**
 * Asset is anything but ModuleCategory. Intended to keep data that were not parsable.
 * For example graphical or audio files, config files.
 *
 * Optionally, if the asset data is in text format, then holds the data in the source.
 */
export type Asset = Omit<Module, "type" | "source"> & {
    type: ElementType.Asset;
    source?: string;
};
export type Attributes = Record<string, ReflectLink | string>;
export type Component = {
    class: ModuleLink;
    url: string;
    slots: Slots;
    get: unknown;
    attributes: Attributes;
};
export type Expression = Omit<Component, "attributes" | "class"> & {
    prefix: string;
    suffix: string;
};
export type Text = Omit<Component, "attributes" | "class" | "slots"> & {
    value: string;
};
export type Page = Omit<Component, "class" | "url" | "get" | "attributes"> & Omit<Module, "type"> & {};
