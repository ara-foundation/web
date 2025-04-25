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
import { Debug, Result, type EnumlikeKeyValue } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { ValueType } from "../code-level/ast-node-data.js";
import { TsNode } from "../code-level/ts-node.js";
import { PackageURL } from "packageurl-js";
import { ModuleCategory } from "../module.js";

const ReflectProtocol = "reflect"
export type ModuleURL = `pkg:npm${string}`;

const version = undefined;
const IdentifierSlugs = ["id"]
const ExpressionSlugs = ["exp"]

export class ModuleLink extends PackageURL {
    constructor(namespace: string, name: string, category: string, subpath: string) {
        super("npm", namespace, name, version, {category: category}, subpath);
    }

    public get category(): string {
        if (this.qualifiers === undefined || this.qualifiers["category"] === undefined) {
            return ModuleCategory.Untracked;
        }
        return this.qualifiers["category"];
    }

    public get moduleURL(): ModuleURL {
        return this.toString() as ModuleURL;
    }

    public isEqual(moduleUrl: ModuleURL): boolean {
        return this.moduleURL === moduleUrl;
    }

    public static fromModuleURL(moduleURL: ModuleURL): Result<ModuleLink> {
        try {
            return Result.ok(super.fromString(moduleURL) as ModuleLink);
        } catch (e) {
            return Result.fail(`Invalid url '${moduleURL}'`, (e as any).message)
        }
    }
}

export class ReflectAraLink {
    public static linkToIdentifier = (identifier: string, properties?: EnumlikeKeyValue): AraLink<string> => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    }

    public static linkToExpression = (expression: TsNode): AraLink<TsNode> => {
        const araLink = new AraLink<TsNode>(ReflectProtocol, expression, ExpressionSlugs) 
        return araLink;  
    }

    public static isIdentifierLink = (araLink: ValueType | undefined): boolean => {
        if (araLink === undefined) {
            return false;
        }
        if (!(araLink instanceof AraLink)) {
            return false;
        }

        if (!araLink.isCorrectPath(ReflectProtocol, IdentifierSlugs)) {
            return false;
        }

        return typeof araLink.resource === "string";
    }

    public static isExpressionLink = (araLink: ValueType |undefined): boolean => {
        if (araLink === undefined) {
            return false;
        }
        if (!(araLink instanceof AraLink)) {
            return false;
        }

        if (!araLink.isCorrectPath(ReflectProtocol, ExpressionSlugs)) {
            return false;
        }
        return (araLink.resource instanceof TsNode)
    }

    public static getIdentifierResource = (araLink: ValueType | undefined): string|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        return araLink.resource as string;
    }

    /**
     * Returns the TsNode from the AraLink.
     * @param araLink 
     * @returns {TsNode|undefined}
     */
    public static getExpressionResource = (araLink: ValueType | undefined): TsNode|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        return araLink.resource as TsNode;
    }
}
