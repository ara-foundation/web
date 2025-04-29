/**
 * Reflect related Ara Links such as
 * - Identifiers
 * - Expressions
 */
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { ValueType } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";
export declare class CodeLink {
    static linkToIdentifier: (identifier: string, properties?: object) => AraLink<string>;
    static linkToExpression: (expression: TsNode) => AraLink<TsNode>;
    static isIdentifierLink: (araLink: ValueType | undefined) => boolean;
    static isExpressionLink: (araLink: ValueType | undefined) => boolean;
    static getIdentifierResource: (araLink: ValueType | undefined) => string | undefined;
    /**
     * Returns the TsNode from the AraLink.
     * @param araLink
     * @returns {TsNode|undefined}
     */
    static getExpressionResource: (araLink: ValueType | undefined) => TsNode | undefined;
}
