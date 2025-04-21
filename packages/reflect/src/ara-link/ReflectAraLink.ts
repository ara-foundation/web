/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Expressions
 */
/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Expressions
 */
import type { EnumlikeKeyValue } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { ValueType } from "../code-level/ast-node-data.js";

const ReflectProtocol = "reflect"
const IdentifierSlugs = ["reflect", "codeLevel", "identifier"]
const ExpressionSlugs = ["reflect", "codeLevel", "expression"]

export class ReflectAraLink {
    public static linkToIdentifier = (identifier: string, properties?: EnumlikeKeyValue): AraLink<string> => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    }

    public static linkToExpression = (expression: string): AraLink<string> => {
        const araLink = new AraLink<string>(ReflectProtocol, expression, ExpressionSlugs) 
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
        return typeof araLink.resource === "string"
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

    public static getExpressionResource = (araLink: ValueType | undefined): string|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        return araLink.resource as string;
    }
}
