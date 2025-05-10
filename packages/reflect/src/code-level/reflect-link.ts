/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Ts Nodes (to parse or connect between ts node tree)
 * - Expressions
 */
import { AraLink } from "@ara-web/p-hintjens";
import type { ValueType } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";

export const ReflectProtocol = "reflect"

export const IdentifierSlugs = ["id"]
export const TsNodeSlugs = ["tsnode"]
export const ExpressionSlugs = ["exp"]

export class ReflectLink {
    public static linkToIdentifier = (identifier: string, properties?: object): AraLink<string> => {
        const araLink = new AraLink(ReflectProtocol, identifier, IdentifierSlugs, properties);
        return araLink;
    }

    public static linkToExpression = (exp: string, props: object): AraLink<string> => {
        const araLink = new AraLink(ReflectProtocol, (props as any)["identifier"], ExpressionSlugs, {...props, exp});
        return araLink;
    }

    public static linkToTsNode = (tsNode: TsNode): AraLink<TsNode> => {
        const araLink = new AraLink<TsNode>(ReflectProtocol, tsNode, TsNodeSlugs) 
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

    public static isExpressionLink = (araLink: ValueType | undefined): boolean => {
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
    }

    public static isTsNodeLink = (araLink: ValueType |undefined): boolean => {
        if (araLink === undefined) {
            return false;
        }
        if (!(araLink instanceof AraLink)) {
            return false;
        }

        if (!araLink.isCorrectPath(ReflectProtocol, TsNodeSlugs)) {
            return false;
        }
        return (araLink.resource instanceof TsNode)
    }

    public static getResourceAsIdentifier = (araLink: ValueType | undefined): string|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        return araLink.resource as string;
    }

    public static getResourceAsExpression = (araLink: ValueType | undefined): string|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        if (araLink.isPropertyExist("exp")) {
            return araLink.property("exp")!.toString();
        }
        return undefined;
    }

    /**
     * Returns the TsNode from the AraLink.
     * @param araLink 
     * @returns {TsNode|undefined}
     */
    public static getResourceAsTsNode = (araLink: ValueType | undefined): TsNode|undefined => {
        if (araLink === undefined) {
            return undefined;
        }
        if (!(araLink instanceof AraLink)) {
            return undefined;
        }

        return araLink.resource as TsNode;
    }
}
