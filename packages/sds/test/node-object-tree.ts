import { OkResult } from "@ara-web/p-hintjens";
import { type DataToObjectNode, type DataOperations, ObjectNode, DOCUMENT_SELECTOR } from "../src/tree";

export const nodeToObjectTree: DataToObjectNode<HTMLElement> = (data?: HTMLElement, parent?: ObjectNode<HTMLElement>): ObjectNode<HTMLElement> => {
	return new ObjectNode<HTMLElement>(elementOps, nodeToObjectTree, data, parent);
}

export const MODULE_SELECTOR = '*:nth-child(1) >';

const getName = (el?: HTMLElement): string => {
	if (el === undefined) {
		return DOCUMENT_SELECTOR;
	}
    return el!.nodeName;
}

const getChildren = (el: HTMLElement): HTMLElement[] => {
	const children: HTMLElement[] = [];
	for (const child of el.children) {
		children.push(child as HTMLElement);
	}
	return children;
}

const getAttribute = (el: HTMLElement | undefined, attrName: string): string | undefined => {
	if (el === undefined) {
		if (attrName === 'id') {
			return DOCUMENT_SELECTOR;
		}
		return undefined;
	}
	const attr = el.getAttribute(attrName);
	if (attr === null) {
		return undefined
	}
	return attr;
}

const setAttribute = <AttrType>(el: HTMLElement | undefined, attrName: string, attrValue: AttrType): OkResult => {
	if (el === undefined) {
		return OkResult.ok();
	}
	el.setAttribute(attrName, attrValue as string);
	return OkResult.ok();
}

export const elementOps: DataOperations<HTMLElement> = {
	getName: getName,
	getChildren: getChildren,
	getAttribute: getAttribute,
	setAttribute: setAttribute,
}
