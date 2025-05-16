/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Ts Nodes (to parse or connect between ts node tree)
 * - Expressions
 */
import { Node } from "ts-morph";
import { AraLink } from "@ara-web/sds";
import type { ValueType } from "./code-piece-types.js";
export declare const ReflectProtocol = "reflect";
export declare const IdentifierSlugs: string[];
export declare const TsNodeSlugs: string[];
export declare const ExpressionSlugs: string[];
export declare class ReflectLink {
    static linkToIdentifier: (identifier: string, properties?: object) => AraLink<string>;
    static linkToExpression: (exp: string, props: object) => AraLink<string>;
    static linkToTsNode: (tsNode: Node) => AraLink<Node>;
    static isIdentifierLink: (araLink: ValueType | undefined) => boolean;
    static isExpressionLink: (araLink: ValueType | undefined) => boolean;
    static isTsNodeLink: (araLink: ValueType | undefined) => boolean;
    static getResourceAsIdentifier: (araLink: ValueType | undefined) => string | undefined;
    static getResourceAsExpression: (araLink: ValueType | undefined) => string | undefined;
    /**
     * Returns the Node from the AraLink.
     * @param araLink
     * @returns {undefined}
     */
    static getResourceAsTsNode: (araLink: ValueType | undefined) => Node | undefined;
}
