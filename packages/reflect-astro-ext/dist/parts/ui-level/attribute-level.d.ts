import type { AttributeNode } from "@astrojs/compiler/types";
import { Result } from "@ara-web/ts-enhancement/result";
import { type AstroNode, type ModuleParts } from "#ontology";
import type { AraLink } from "@ara-web/ts-enhancement/ara-link";
import type { TsNode } from "@ara-web/reflect/code-level/ts-node";
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
