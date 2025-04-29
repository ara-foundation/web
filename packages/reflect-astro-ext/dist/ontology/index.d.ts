import type { ComponentNode as AstroComponentNode, ElementNode, ExpressionNode } from "@astrojs/compiler/types";
import type { ModuleLink } from "@ara-web/ts-enhancement/module-link";
import type { ModuleMemory } from "@ara-web/reflect/memory";
import type { Result } from "@ara-web/ts-enhancement/result";
export type AstroNode = ElementNode | ExpressionNode | AstroComponentNode;
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
export type Slots = {
    [key: string]: (Component | Expression | Layout)[];
};
/**
 * Script
 */
export type Script = Meta & {
    moduleLink: ModuleLink;
    fileExtension: FileExtension;
    glob: unknown;
    type: ElementType.Script;
    source: string;
};
/**
 * Asset is anything but ModuleCategory. Intended to keep data that were not parsable.
 * For example graphical or audio files, config files.
 *
 * Optionally, if the asset data is in text format, then holds the data in the source.
 */
export type Asset = Omit<Script, "type" | "source"> & {
    type: ElementType.Asset;
    source?: string;
};
export type Component = Meta & {
    type: ElementType.Component;
    url: string;
    slots: Slots;
    glob: unknown;
};
export type Page = Omit<Component, "type"> & {
    type: ElementType.Page;
};
export type Layout = Omit<Component, "type"> & {
    type: ElementType.Layout;
};
export type Expression = Omit<Component, "type"> & {
    type: ElementType.Expression;
    prefix: string;
    suffix: string;
};
