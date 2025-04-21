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

const ReflectProtocol = "reflect"
const IdentifierSlugs = ["reflect", "codeLevel", "identifier"]
const ExpressionSlugs = ["reflect", "codeLevel", "expression"]

export class ReflectAraLink {
    public static linkToIdentifier = (identifier: string, properties?: EnumlikeKeyValue): AraLink<string> => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    }

    public static linkToExpression = <T>(identifier: string, expression: T): AraLink<T> => {
        const araLink = new AraLink<T>(ReflectProtocol, expression, ExpressionSlugs, {'identifier': identifier}) 
        return araLink;  
    }

    public static isIdentifierLink = (araLink: AraLink<string>): boolean => {
        return araLink.isCorrectPath(ReflectProtocol, IdentifierSlugs)
    }

    public static isExpressionLink = <T>(araLink: AraLink<T>|undefined): boolean => {
        if (araLink === undefined) {
            return false;
        }

        return araLink.isCorrectPath(ReflectProtocol, ExpressionSlugs)
    }
}
