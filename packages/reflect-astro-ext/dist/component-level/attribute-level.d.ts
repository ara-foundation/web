import type { AttributeNode } from "@astrojs/compiler/types";
import { Result, AraLink } from "@ara-web/p-hintjens";
import { TsNode } from "@ara-web/reflect/code-level";
import { type AstroNode, type ModuleParts, type Attributes } from "../index.js";
export declare class AttributeLevel {
    static getNodeAttributes(node: AstroNode): Result<Attributes>;
    /**
     * Find the page attribute's value of the component.
     * Expected to be called by identifyComponent()
     * @param {AttributeNode} attr expression in the attribute
    */
    static identifyAttributeNode: (attr: AttributeNode, kind?: string) => Result<Attributes>;
}
/**
 * Look up and retreive the attribute by its name
 * @param {AstroNode} node that has the attributes of a sinle component
 * @param {string} name name of the attribute
 * @returns {AttributeNode}
*/
export declare const attributeByName: (node: AstroNode, name?: string) => AttributeNode | undefined;
/**
 * Find the page attribute's value of the component.
 * Expected to be called by identifyComponent()
 * @param {AttributeNode} attr expression in the attribute
*/
export declare const identifyAttribute: <T>(_uiContent: ModuleParts, attr: AttributeNode, kind?: string) => Promise<Result<T | AraLink<TsNode>>>;
