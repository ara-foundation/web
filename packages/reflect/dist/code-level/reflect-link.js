/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Ts Nodes (to parse or connect between ts node tree)
 * - Expressions
 */
import { AraLink } from "@ara-web/p-hintjens";
import { TsNode } from "./ts-node.js";
export const ReflectProtocol = "reflect";
export const IdentifierSlugs = ["id"];
export const TsNodeSlugs = ["tsnode"];
export const ExpressionSlugs = ["exp"];
export class ReflectLink {
    static linkToIdentifier = (identifier, properties) => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    };
    static linkToExpression = (exp, props) => {
        const araLink = new AraLink(ReflectProtocol, props["identifier"], ExpressionSlugs, { ...props, exp });
        return araLink;
    };
    static linkToTsNode = (tsNode) => {
        const araLink = new AraLink(ReflectProtocol, tsNode, TsNodeSlugs);
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
        return typeof araLink.resource === "string";
    };
    static isTsNodeLink = (araLink) => {
        if (araLink === undefined) {
            return false;
        }
        if (!(araLink instanceof AraLink)) {
            return false;
        }
        if (!araLink.isCorrectPath(ReflectProtocol, TsNodeSlugs)) {
            return false;
        }
        return (araLink.resource instanceof TsNode);
    };
    static getResourceAsIdentifier = (araLink) => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }
        return araLink.resource;
    };
    static getResourceAsExpression = (araLink) => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }
        if (araLink.isPropertyExist("exp")) {
            return araLink.property("exp").toString();
        }
        return undefined;
    };
    /**
     * Returns the TsNode from the AraLink.
     * @param araLink
     * @returns {TsNode|undefined}
     */
    static getResourceAsTsNode = (araLink) => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }
        return araLink.resource;
    };
}
