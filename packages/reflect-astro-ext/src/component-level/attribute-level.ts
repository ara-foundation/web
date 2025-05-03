import type { AttributeNode } from "@astrojs/compiler/types";
import { Result } from "@ara-web/p-hintjens";
import { type AstroNode, type Attributes } from "../index.js";
import { ReflectLink } from "@ara-web/reflect/code-level";

export class AttributeLevel {
    /**
     * Extracts and identifies attributes from an AstroNode.
     * 
     * @param {AstroNode} node - The AstroNode containing attributes to process.
     * @returns {Result<Attributes>} A Result object containing the identified attributes
     * or an error if attribute identification fails.
     */
    public static getNodeAttributes(node: AstroNode, name?: string): Result<Attributes> {
        let attributes: Attributes = {}
        for (const attrNode of node.attributes) {
            const identifiedAttr = this.identifyAttributeNode(attrNode);
            if (identifiedAttr.isFailure) {
                return Result.fail(`this.identifyAttributeNode('${attrNode.name}'): ${identifiedAttr.errorTitle}`, identifiedAttr.errorDescription!)
            } 
            if (name !== undefined && attrNode.name !== name) {
                continue;
            }

            attributes = {...attributes, ...identifiedAttr.getValue()}
        }

        return Result.ok(attributes);
    }

    /**
     * Find the page attribute's value of the component.
     * Expected to be called by `identifyComponent()`
     * @param {AttributeNode} attr expression in the attribute.
     * @param {string} kind - The expected kind of the attribute, for example `quoted` or `expression`.
     * @returns {Result<Attributes>} A Result object containing the identified attributes
     * or an error if attribute identification fails.
     * @throws {Error} If the attribute kind is not supported.
     * @throws {Error} If the attribute kind does not match the expected kind.
    */
    private static identifyAttributeNode = (attr: AttributeNode, kind?: string): Result<Attributes> => {
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