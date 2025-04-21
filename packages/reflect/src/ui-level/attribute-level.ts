import type { AttributeNode } from "@astrojs/compiler/types";
import { Result } from "@ara-web/ts-enhancement";
import { type AstroNode } from "@ara-web/component-engine";
import type { UiContent } from "./ui-content.js";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import type { AraLink } from "@ara-web/ts-enhancement/ara-link";

/**
 * Look up and retreive the attribute by its name
 * @param {AstroNode} node that has the attributes of a sinle component 
 * @param {string} name name of the attribute 
 * @returns {AttributeNode}
*/
export const attributeByName = (node: AstroNode, name?: string): AttributeNode|undefined => {
        if (node.type === "expression") {
            return attributeByName(node.children[1] as AstroNode)
        }
        for (let callAttr of node.attributes) {
            if (callAttr.name === name) {
                return callAttr;
            }
        }
}

/**
 * Find the page attribute's value of the component.
 * Expected to be called by identifyComponent()
 * @param {AttributeNode} attr expression in the attribute
*/
export const identifyAttribute = async <T>(uiContent: UiContent, attr: AttributeNode, kind?: string): Promise<Result<T|AraLink<string>>> => {
    const ret: {error?: string, data?: T} = {
        error: undefined,
        data: undefined,
    }
    
    if (kind !== undefined && attr.kind !== kind) {
        return Result.fail(
            `Attribute kind mismatch`,
            `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`
        )
    }

    if (attr.kind === "quoted") {
        return Result.ok(attr.value as T)
    } else if (attr.kind !== "expression") {
        return Result.fail(
            `Unsupported attribute kind '${attr.kind}'`,
            `Ara Web supports quoted and expression kind of attributes only`
        )
    }

    return Result.ok(ReflectAraLink.linkToExpression(attr.value));
}
