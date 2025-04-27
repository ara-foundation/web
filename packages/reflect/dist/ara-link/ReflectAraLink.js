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
import { Result } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { TsNode } from "../code-level/ts-node.js";
import { PackageURL } from "packageurl-js";
import { ModuleCategory } from "../module.js";
const ReflectProtocol = "reflect";
const version = undefined;
const IdentifierSlugs = ["id"];
const ExpressionSlugs = ["exp"];
export class ModuleLink extends PackageURL {
    constructor(namespace, name, category, subpath) {
        super("npm", namespace, name, version, { category: category }, subpath);
    }
    get category() {
        if (this.qualifiers === undefined || this.qualifiers["category"] === undefined) {
            return ModuleCategory.Untracked;
        }
        return this.qualifiers["category"];
    }
    get moduleURL() {
        return this.toString();
    }
    get modulePath() {
        return this.subpath;
    }
    isEqual(moduleUrl) {
        return this.moduleURL === moduleUrl;
    }
    static fromModuleURL(moduleURL) {
        try {
            return Result.ok(super.fromString(moduleURL));
        }
        catch (e) {
            return Result.fail(`Invalid url '${moduleURL}'`, e.message);
        }
    }
}
export class ReflectAraLink {
    static linkToIdentifier = (identifier, properties) => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    };
    static linkToExpression = (expression) => {
        const araLink = new AraLink(ReflectProtocol, expression, ExpressionSlugs);
        return araLink;
    };
    static isIdentifierLink = (araLink) => {
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
    };
    static isExpressionLink = (araLink) => {
        if (araLink === undefined) {
            return false;
        }
        if (!(araLink instanceof AraLink)) {
            return false;
        }
        if (!araLink.isCorrectPath(ReflectProtocol, ExpressionSlugs)) {
            return false;
        }
        return (araLink.resource instanceof TsNode);
    };
    static getIdentifierResource = (araLink) => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }
        return araLink.resource;
    };
    /**
     * Returns the TsNode from the AraLink.
     * @param araLink
     * @returns {TsNode|undefined}
     */
    static getExpressionResource = (araLink) => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }
        return araLink.resource;
    };
}
