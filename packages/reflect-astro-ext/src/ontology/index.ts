import { type ModuleLink, ObjectLink, Result } from "@ara-web/p-hintjens";
import { 
    FileExtension as BaseExtension, 
    ModuleMemory 
} from "@ara-web/reflect";
import type { ReflectLink } from "@ara-web/reflect/code-level";
import { AstroNode } from "../index.js";

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
    Asset,      // For example Images, Markdown files
                // Anything provided as it is, and not parsable as ontological data yet. Perhaps use AI for it?
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

/**
 * Attribute name => Attribute value or a link to the code expression.
 */
export type Attributes = Record<string, ReflectLink|string>;

export type Component = {
    class: ModuleLink;
    link: ObjectLink;
    slots: Slots;
    get: unknown;
    attributes: Attributes;
}

export type Expression = Omit<Component, "attributes" | "class"> & {
    description?: string;   // description of the expression
    type: ElementType.Expression;
}

export type Text = Omit<Component, "attributes" | "class" | "slots"> & {
    value: string;
}

export type Page = Omit<Component, "class" | "link" | "get" | "attributes"> & Omit<Module, "type" > & {};
