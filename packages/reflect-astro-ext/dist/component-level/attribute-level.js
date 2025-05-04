import { Result } from "@ara-web/p-hintjens";
import { CodeLevel } from "../index.js";
import { ReflectLink } from "@ara-web/reflect/code-level";
export class AttributeLevel {
    static lintAttributes = async (attributes, moduleMemory, projectMemory) => {
        for (const attrName in attributes) {
            const attr = attributes[attrName];
            if (!ReflectLink.isExpressionLink(attr)) {
                continue;
            }
            const exp = ReflectLink.getResourceAsExpression(attr);
            if (exp === undefined) {
                return Result.fail(`this.lintAttributes(): ${attrName} is not a valid expression`, `The attribute '${attrName}' is not a valid expression`);
            }
            const identifiedResult = await CodeLevel.identifyCodePiece(exp, moduleMemory, projectMemory);
            if (identifiedResult.isFailure) {
                return Result.fail(`CodeLevel.identifyCodePeice('${exp}'): ${identifiedResult.errorTitle}`, identifiedResult.errorDescription);
            }
            attributes[attrName] = identifiedResult.getValue();
        }
        return Result.ok(attributes);
    };
    /**
     * Extracts and identifies attributes from an AstroNode.
     *
     * @param {AstroNode} node - The AstroNode containing attributes to process.
     * @returns {Result<Attributes>} A Result object containing the identified attributes
     * or an error if attribute identification fails.
     */
    static getNodeAttributes(node, name) {
        let attributes = {};
        for (const attrNode of node.attributes) {
            const identifiedAttr = this.identifyAttributeNode(attrNode);
            if (identifiedAttr.isFailure) {
                return Result.fail(`this.identifyAttributeNode('${attrNode.name}'): ${identifiedAttr.errorTitle}`, identifiedAttr.errorDescription);
            }
            if (name !== undefined && attrNode.name !== name) {
                continue;
            }
            attributes = { ...attributes, ...identifiedAttr.getValue() };
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
    static identifyAttributeNode = (attr, kind) => {
        const identified = {};
        const attrName = attr.name;
        let attrValue = "";
        if (kind !== undefined && attr.kind !== kind) {
            return Result.fail(`Attribute kind mismatch`, `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`);
        }
        if (attr.kind === "quoted") {
            attrValue = attr.value;
        }
        else if (attr.kind === "expression") {
            attrValue = ReflectLink.linkToExpression(attr.value, { identifier: attrName });
        }
        else {
            return Result.fail(`Unsupported attribute kind '${attr.kind}'`, `Ara Web supports quoted and expression kind of attributes only`);
        }
        identified[attrName] = attrValue;
        return Result.ok(identified);
    };
}
