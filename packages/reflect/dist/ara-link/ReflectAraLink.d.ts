/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Expressions
 *
 * Built in NodeJS Modules:
    pkg:npm/<module as it is>

    We pass the file name as the sub-path
    pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro

    The Identifiers (schema: reflect, type: code, namespace: id, value: name)
    pkg:reflect/id/name?properties#
    The Expression or a node
    reflect:code/exp/{name}?properties?purl=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro

    Each Extension has few methods that converts file path to the ara link and reverse.
    To support it, the file names shall not have the ./ or ../
    filePathToAraLink = (moduleCategory, filePath): AraLink
    araLinkToModulePaths = (AraLink): string[]
    modulePathToAraLinks = (modulePath): AraLink[]

 */
import { Result, type EnumlikeKeyValue } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { ValueType } from "../code-level/ast-node-data.js";
import { TsNode } from "../code-level/ts-node.js";
import { PackageURL } from "packageurl-js";
export type ModuleURL = `pkg:npm${string}`;
export declare class ModuleLink extends PackageURL {
    constructor(namespace: string, name: string, category: string, subpath: string);
    get category(): string;
    get moduleURL(): ModuleURL;
    get modulePath(): string | undefined;
    isEqual(moduleUrl: ModuleURL): boolean;
    static fromModuleURL(moduleURL: ModuleURL): Result<ModuleLink>;
}
export declare class ReflectAraLink {
    static linkToIdentifier: (identifier: string, properties?: EnumlikeKeyValue) => AraLink<string>;
    static linkToExpression: (expression: TsNode) => AraLink<TsNode>;
    static isIdentifierLink: (araLink: ValueType | undefined) => boolean;
    static isExpressionLink: (araLink: ValueType | undefined) => boolean;
    static getIdentifierResource: (araLink: ValueType | undefined) => string | undefined;
    /**
     * Returns the TsNode from the AraLink.
     * @param araLink
     * @returns {TsNode|undefined}
     */
    static getExpressionResource: (araLink: ValueType | undefined) => TsNode | undefined;
}
