import { Result } from "@ara-web/ts-enhancement";
import {} from "@ara-web/component-engine";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
/**
 * Look up and retreive the attribute by its name
 * @param {AstroNode} node that has the attributes of a sinle component
 * @param {string} name name of the attribute
 * @returns {AttributeNode}
*/
export const attributeByName = (node, name) => {
    if (node.type === "expression") {
        return attributeByName(node.children[1]);
    }
    for (let callAttr of node.attributes) {
        if (callAttr.name === name) {
            return callAttr;
        }
    }
};
/**
 * Find the page attribute's value of the component.
 * Expected to be called by identifyComponent()
 * @param {AttributeNode} attr expression in the attribute
*/
export const identifyAttribute = async (uiContent, attr, kind) => {
    const ret = {
        error: undefined,
        data: undefined,
    };
    if (kind !== undefined && attr.kind !== kind) {
        return Result.fail(`Attribute kind mismatch`, `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`);
    }
    if (attr.kind === "quoted") {
        return Result.ok(attr.value);
    }
    else if (attr.kind !== "expression") {
        return Result.fail(`Unsupported attribute kind '${attr.kind}'`, `Ara Web supports quoted and expression kind of attributes only`);
    }
    return Result.errorCode501(["UI Level", "Attribute Level"], "identifyAttribute");
    // return Result.ok(ReflectAraLink.linkToExpression(attr.value));
};
