import { OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, DOCUMENT_SELECTOR } from "@ara-web/sds";
import { CodePiece } from "./code-level/index.js";
export const moduleToObjectTree = (codePiece, parent, root) => {
    // Creating the root for entire source code that has one or many code pieces.
    if (root) {
        return new ObjectNode(codePieceOps);
    }
    else if (parent !== undefined) {
        return new ObjectNode(codePieceOps, codePiece, parent);
    }
    return new ObjectNode(codePieceOps, codePiece);
};
export const MODULE_SELECTOR = '*:nth-child(1) >';
const getCodePieceName = (_element) => {
    if (_element === undefined) {
        return DOCUMENT_SELECTOR;
    }
    return _element.nodeType.toString();
};
const getCodePieceChildren = (el) => {
    return el.getAllMemoryData();
};
const getCodePieceAttribute = (_element, attrName) => {
    if (_element === undefined) {
        if (attrName === 'id') {
            return DOCUMENT_SELECTOR;
        }
        return undefined;
    }
    if (attrName === "id") {
        return _element.identifier;
    }
    if (attrName in _element) {
        return _element[attrName]?.toString();
    }
    return undefined;
};
const setCodePieceAttribute = (_element, attrName, attrValue) => {
    if (_element === undefined) {
        return OkResult.ok();
    }
    if (attrName === "id") {
        return OkResult.fail(`Can not set id`, `Please dont set id`);
    }
    if (attrName in _element) {
        _element[attrName] = attrValue;
        return OkResult.ok();
    }
    else {
        return OkResult.fail(`The ${_element.identifier} has no attributes`, `Can not set ${attrName} to non attributal element`);
    }
};
export const codePieceOps = {
    getName: getCodePieceName,
    getChildren: getCodePieceChildren,
    getAttribute: getCodePieceAttribute,
    setAttribute: setCodePieceAttribute,
};
