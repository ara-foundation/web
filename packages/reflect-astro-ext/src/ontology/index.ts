import type { ComponentNode as AstroComponentNode, ElementNode, ExpressionNode } from "@astrojs/compiler/types";
import type { ModuleLink } from "@ara-web/ts-enhancement/module-link";
import { FileExtension as BaseExtension } from "@ara-web/reflect/module";
import type { ModuleMemory } from "@ara-web/reflect/memory";
import type { Result } from "@ara-web/ts-enhancement/result";
export type AstroNode = ElementNode | ExpressionNode | AstroComponentNode

/**
 * Any UI Content is composed of the HTML Elements and the source code
 */
export type ModuleParts = {
    fileExtension: FileExtension,
    elements?: AstroNode[],             // Change to the generic to support react.
    source?: string,
}

export interface OntologoicalIdentifier {
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

export type Slots = {
    [key: string]: (Component | Expression | Layout)[];
}

/**
 * Script
 */
export type Script = Meta & {
    moduleLink: ModuleLink
    fileExtension: FileExtension;
    glob: unknown;
    type: ElementType.Script;
    source: string;             // Source code of the script as it is.
}

/**
 * Asset is anything but ModuleCategory. Intended to keep data that were not parsable.
 * For example graphical or audio files, config files.
 * 
 * Optionally, if the asset data is in text format, then holds the data in the source.
 */
export type Asset = Omit<Script, "type" | "source"> & {
    type: ElementType.Asset;
    source?: string
}

export type Component = Meta & {
    type: ElementType.Component
    url: string;
    slots: Slots;
    glob: unknown;
}

export type Page = Omit<Component, "type"> & {
    type: ElementType.Page
};

export type Layout = Omit<Component, "type"> & {
    type: ElementType.Layout
}

export type Expression =  Omit<Component, "type"> & {
    type: ElementType.Expression;
    prefix: string;
    suffix: string;
}
