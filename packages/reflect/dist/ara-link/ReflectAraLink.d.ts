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
import { TsNode } from "../code-level/ts-node.js";
export declare class ReflectAraLink {
    static linkToIdentifier: (identifier: string, properties?: EnumlikeKeyValue) => AraLink<string>;
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
