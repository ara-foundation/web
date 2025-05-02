import type { AttributeNode } from "@astrojs/compiler/types";
import { Result, AraLink } from "@ara-web/ts-enhancement";
import { TsNode } from "@ara-web/reflect/code-level";
import { type AstroNode, type ModuleParts, type Attributes } from "../index.js";
import { ReflectLink } from "@ara-web/reflect/code-level";

export class AttributeLevel {
    public static getNodeAttributes(node: AstroNode): Result<Attributes> {
        let attributes: Attributes = {}
        for (const attrNode of node.attributes) {
            const identifiedAttr = this.identifyAttributeNode(attrNode);
            if (identifiedAttr.isFailure) {
                return Result.fail(`this.identifyAttributeNode('${attrNode.name}'): ${identifiedAttr.errorTitle}`, identifiedAttr.errorDescription!)
            }

            attributes = {...attributes, ...identifiedAttr.getValue()}
        }

        return Result.ok(attributes);
    }

    /**
     * Find the page attribute's value of the component.
     * Expected to be called by identifyComponent()
     * @param {AttributeNode} attr expression in the attribute
    */
    public static identifyAttributeNode = (attr: AttributeNode, kind?: string): Result<Attributes> => {
        const identified: Attributes = {};
        const attrName = attr.name;
        let attrValue: string|ReflectLink = "";

        if (kind !== undefined && attr.kind !== kind) {
            return Result.fail(
                `Attribute kind mismatch`,
                `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`
            )
        }

        if (attr.kind === "quoted") {
            attrValue = attr.value;
        } else if (attr.kind === "expression") {
            attrValue = ReflectLink.linkToExpression(attr.value, {identifier: attrName})
        } else {
            return Result.fail(
                `Unsupported attribute kind '${attr.kind}'`,
                `Ara Web supports quoted and expression kind of attributes only`
            )
        }

        identified[attrName] = attrValue;
        return Result.ok(identified);
    }
}

/**
 * Look up and retreive the attribute by its name
 * @param {AstroNode} node that has the attributes of a sinle component 
 * @param {string} name name of the attribute 
 * @returns {AttributeNode}
*/
export const attributeByName = (node: AstroNode, name?: string): AttributeNode|undefined => {
    for (const callAttr of node.attributes) {
        if (callAttr.name === name) {
            return callAttr;
        }
    }

    return undefined;
}

/**
 * Find the page attribute's value of the component.
 * Expected to be called by identifyComponent()
 * @param {AttributeNode} attr expression in the attribute
*/
export const identifyAttribute = async <T>(_uiContent: ModuleParts, attr: AttributeNode, kind?: string): Promise<Result<T|AraLink<TsNode>>> => {
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

    return Result.errorCode501(["UI Level", "Attribute Level"], "identifyAttribute")
    // return Result.ok(ReflectAraLink.linkToExpression(attr.value));
}
