import { Result } from "@ara-web/p-hintjens";
import { ModuleLink, ObjectLink } from "@ara-web/sds";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import type { ReflectLink } from "@ara-web/reflect/code-level";
import { AstroNode } from "../index.js";
import type { ValueType } from "@ara-web/reflect/code-level";
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
    identify: <T>(parts: ModuleParts, memory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<T>>;
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
    Asset = 5,// For example Images, Markdown files
    Text = 6
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
/**
 * Attribute name => Attribute value or a link to the code expression.
 */
export type Attributes = Record<string, ReflectLink | ValueType>;
export type Component = {
    componentClass: ModuleLink;
    link: ObjectLink;
    slots: Slots;
    get: unknown;
    attributes: Attributes;
    type: ElementType.Component;
};
export type Expression = Omit<Component, "attributes" | "componentClass" | "type"> & {
    description?: string;
    type: ElementType.Expression;
};
export type Text = Omit<Component, "attributes" | "componentClass" | "slots" | "type"> & {
    value: string;
    type: ElementType.Text;
};
export type Page = Omit<Component, "componentClass" | "link" | "get" | "attributes" | "type"> & Omit<Module, "type"> & {};
