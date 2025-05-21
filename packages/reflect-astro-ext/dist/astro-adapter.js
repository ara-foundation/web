import { AstroNode } from "./astro-node.js";
import { Debug, OkResult } from "@ara-web/p-hintjens";
import { DOCUMENT_SELECTOR, ObjectNode } from "@ara-web/sds";
/**
     * For Pages, it returns empty string.
     */
const getAstroElementName = (_element) => {
    if (_element === undefined) {
        return DOCUMENT_SELECTOR;
    }
    return _element.name;
};
const getAstroElementAttribute = (_element, attrName) => {
    if (_element === undefined) {
        return undefined;
    }
    if (_element.attributes) {
        for (const attr of _element.attributes) {
            if (attr.name.toLocaleLowerCase() === attrName.toLocaleLowerCase()) {
                return attr.value;
            }
        }
    }
    return undefined;
};
const setAstroElementAttribute = (_element, attrName, attrValue) => {
    if (_element === undefined) {
        return OkResult.fail(`No element provided`);
    }
    // Assume attrValue is of type AttributeNode, otherwise fail
    if (typeof attrValue.name !== "string" || typeof attrValue.value !== "string") {
        return OkResult.fail(`attrValue must be an AttributeNode`);
    }
    const attributeNode = attrValue;
    if (_element.attributes) {
        for (let attrIndex = 0; attrIndex < _element.attributes.length; attrIndex++) {
            const attr = _element.attributes[attrIndex];
            if (attr.name === attrName) {
                _element.attributes[attrIndex].value = attributeNode.value;
                return OkResult.ok();
            }
        }
    }
    const attrs = [...(_element.attributes), attributeNode];
    _element.setAttributes(attrs);
    return OkResult.ok();
};
const getAstroElementChildren = (el) => {
    if (el === undefined) {
        return []; //doc;
    }
    return el.children;
};
export const astroElementOps = {
    getChildren: getAstroElementChildren,
    getAttribute: getAstroElementAttribute,
    getName: getAstroElementName,
    setAttribute: setAstroElementAttribute,
};
export const astroToNodeTree = (node, parent, root) => {
    if (root === false || root === undefined) {
        if (parent === undefined) {
            throw `Not a root, but parent is missing`;
        }
        return new ObjectNode(astroElementOps, astroToNodeTree, node, parent);
    }
    const obj = new ObjectNode(astroElementOps, astroToNodeTree);
    const children = node.children.map((astroNode) => new ObjectNode(astroElementOps, astroToNodeTree, astroNode, obj));
    obj.setChildren(children);
    return obj;
};
