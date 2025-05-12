/* eslint-disable @typescript-eslint/no-unused-vars */
import { AstroNode } from "./astro-node.js";
import { DOCUMENT_SELECTOR, ObjectNode, OkResult, type ElementOp, type ObjectToNodeTree } from "@ara-web/p-hintjens";
import type { AttributeNode } from "@astrojs/compiler/types";

/**
	 * For Pages, it returns empty string.
	 */
const getAstroElementName = (_element?: AstroNode): string => {
	if (_element === undefined) {
		return DOCUMENT_SELECTOR;
	}
	return _element.name;
}
	
const getAstroElementAttribute = (_element: AstroNode | undefined, attrName: string): string | undefined => {
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
}

const setAstroElementAttribute = <AttrValue>(_element: AstroNode, attrName: string, attrValue: AttrValue): OkResult => {
	if (_element === undefined) {
		return OkResult.fail(`No element provided`);
	}

	// Assume attrValue is of type AttributeNode, otherwise fail
	if (typeof (attrValue as AttributeNode).name !== "string" || typeof (attrValue as AttributeNode).value !== "string") {
		return OkResult.fail(`attrValue must be an AttributeNode`);
	}

	const attributeNode = attrValue as AttributeNode;

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
}

const getAstroElementChildren = (el: AstroNode): AstroNode[] => {
	if (el === undefined) {
		return []//doc;
	}
	return el.children;
}

export const astroElementOps: ElementOp<AstroNode> = {
	getChildren: getAstroElementChildren,
	getAttribute: getAstroElementAttribute,
	getName: getAstroElementName,
	setAttribute: setAstroElementAttribute,
}

export const astroToNodeTree: ObjectToNodeTree<AstroNode> = (node: AstroNode, root: boolean = true): ObjectNode<AstroNode> => {
	if (root === false) {
		return new ObjectNode<AstroNode>(astroElementOps, node);
	}
	const parent = new ObjectNode<AstroNode>(astroElementOps);
	const children = node.children.map((astroNode) => new ObjectNode<AstroNode>(astroElementOps, astroNode, parent));
	parent.setChildren(children)
	return parent;
}
