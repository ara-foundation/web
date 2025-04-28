/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Expressions
 */
import { type EnumlikeKeyValue } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { ValueType } from "../code-level/ast-node-data.js";
import { TsNode } from "../code-level/ts-node.js";

const ReflectProtocol = "reflect"

const IdentifierSlugs = ["id"]
const ExpressionSlugs = ["exp"]

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
