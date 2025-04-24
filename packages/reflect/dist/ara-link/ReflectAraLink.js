import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { TsNode } from "../code-level/ts-node.js";
const ReflectProtocol = "reflect";
const IdentifierSlugs = ["reflect", "codeLevel", "identifier"];
const ExpressionSlugs = ["reflect", "codeLevel", "expression"];
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
