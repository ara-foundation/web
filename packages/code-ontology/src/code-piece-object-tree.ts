import { OkResult } from "@ara-web/p-hintjens";
import { type DataToObjectNode, type DataOperations, ObjectNode, DOCUMENT_SELECTOR } from "@ara-web/sds";
import { CodePiece } from "./code-piece.js";

export const moduleToCodePieceTree: DataToObjectNode<CodePiece> = (codePiece: CodePiece, parent?: ObjectNode<CodePiece>, root?: boolean): ObjectNode<CodePiece> => {
    // Creating the root for entire source code that has one or many code pieces.
	if (root) {
		return new ObjectNode<CodePiece>(codePieceOps, moduleToCodePieceTree);
	} else if (parent === undefined) {
		throw `No root, no parent, can not convert module memory into an object tree node`
	}
	return new ObjectNode<CodePiece>(codePieceOps, moduleToCodePieceTree, codePiece, parent);
}

export const MODULE_SELECTOR = '*:nth-child(1) >';

const getCodePieceName = (_element?: CodePiece): string => {
	if (_element === undefined) {
		return DOCUMENT_SELECTOR;
	}
    return _element!.nodeType!.toString()!;
}

const getCodePieceChildren = (el: CodePiece): CodePiece[] => {
	return el.getAllMemoryData();
}

const getCodePieceAttribute = (_element: CodePiece | undefined, attrName: string): string | undefined => {
	if (_element === undefined) {
		if (attrName === 'id') {
			return DOCUMENT_SELECTOR;
		}
		return undefined;
	}
	if (attrName === "id") {
		return _element.identifier!
	} 
	if (attrName in _element) {
		return (_element as any)[attrName]?.toString();
	}
	return undefined;
}

const setCodePieceAttribute = <AttrType>(_element: CodePiece | undefined, attrName: string, attrValue: AttrType): OkResult => {
	if (_element === undefined) {
		return OkResult.ok();
	}
	if (attrName === "id") {
		return OkResult.fail(`Can not set id`, `Please dont set id`);
	}
	if (attrName in _element) {
		(_element as any)[attrName] = attrValue;
		return OkResult.ok();
	} else {
		return OkResult.fail(`The ${_element.identifier} has no attributes`, `Can not set ${attrName} to non attributal element`)
	}
}

export const codePieceOps: DataOperations<CodePiece> = {
	getName: getCodePieceName,
	getChildren: getCodePieceChildren,
	getAttribute: getCodePieceAttribute,
	setAttribute: setCodePieceAttribute,
}
