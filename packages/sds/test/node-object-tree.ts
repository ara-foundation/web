import { OkResult } from "@ara-web/p-hintjens";
import { type ObjectToNodeTree, type ElementOp, ObjectNode, DOCUMENT_SELECTOR } from "@ara-web/sds";

export const nodeToObjectTree: ObjectToNodeTree<HTMLElement> = (codePiece: HTMLElement, parent?: ObjectNode<HTMLElement>, root?: boolean): ObjectNode<HTMLElement> => {
    // Creating the root for entire source code that has one or many code pieces.
	if (root) {
		return new ObjectNode<HTMLElement>(elementOps, nodeToObjectTree);
	} else if (parent !== undefined) {
	    return new ObjectNode<HTMLElement>(elementOps, nodeToObjectTree, codePiece, parent);
	}
	return new ObjectNode<HTMLElement>(elementOps, nodeToObjectTree, codePiece);
}

export const MODULE_SELECTOR = '*:nth-child(1) >';

const getCodePieceName = (_element?: HTMLElement): string => {
	if (_element === undefined) {
		return DOCUMENT_SELECTOR;
	}
    return _element!.nodeName;
}

const getCodePieceChildren = (el: HTMLElement): HTMLElement[] => {
	const children: HTMLElement[] = [];
	for (const child of el.children) {
		children.push(child as HTMLElement);
	}
	return children;
}

const getCodePieceAttribute = (_element: HTMLElement | undefined, attrName: string): string | undefined => {
	if (_element === undefined) {
		if (attrName === 'id') {
			return DOCUMENT_SELECTOR;
		}
		return undefined;
	}
	const attr = _element.getAttribute(attrName);
	if (attr === null) {
		return undefined
	}
	return attr;
}

const setCodePieceAttribute = <AttrType>(_element: HTMLElement | undefined, attrName: string, attrValue: AttrType): OkResult => {
	if (_element === undefined) {
		return OkResult.ok();
	}
	_element.setAttribute(attrName, attrValue as string);
	return OkResult.ok();
}

export const elementOps: ElementOp<HTMLElement> = {
	getName: getCodePieceName,
	getChildren: getCodePieceChildren,
	getAttribute: getCodePieceAttribute,
	setAttribute: setCodePieceAttribute,
}
