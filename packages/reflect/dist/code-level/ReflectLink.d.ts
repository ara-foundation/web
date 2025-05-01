/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Ts Nodes (to parse or connect between ts node tree)
 * - Expressions
 */
import { AraLink } from "@ara-web/ts-enhancement";
import type { ValueType } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";
export declare const ReflectProtocol = "reflect";
export declare const IdentifierSlugs: string[];
export declare const TsNodeSlugs: string[];
export declare const ExpressionSlugs: string[];
export declare class ReflectLink {
    static linkToIdentifier: (identifier: string, properties?: object) => AraLink<string>;
    static linkToExpression: (exp: string, props: object) => AraLink<string>;
    static linkToTsNode: (tsNode: TsNode) => AraLink<TsNode>;
    static isIdentifierLink: (araLink: ValueType | undefined) => boolean;
    static isExpressionLink: (araLink: ValueType | undefined) => boolean;
    static isTsNodeLink: (araLink: ValueType | undefined) => boolean;
    static getResourceAsIdentifier: (araLink: ValueType | undefined) => string | undefined;
    static getResourceAsExpression: (araLink: ValueType | undefined) => string | undefined;
    /**
     * Returns the TsNode from the AraLink.
     * @param araLink
     * @returns {TsNode|undefined}
     */
    static getResourceAsTsNode: (araLink: ValueType | undefined) => TsNode | undefined;
}
