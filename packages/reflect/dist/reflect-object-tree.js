import { Debug, OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, DOCUMENT_SELECTOR } from "@ara-web/sds";
import { ModuleMemory } from "./module-memory.js";
import { codePieceOps, moduleToObjectTree } from "./code-piece-object-tree.js";
import { ProjectMemory } from "./project-memory.js";
import { CodePiece } from "./code-level/index.js";
export const MEMOP_TAG = "memop"; // extension tag
export const MODULE_MEMORY_TAG = "module";
export const MODULE_MEMORY_SELECTOR = `*:nth-child(1) ${MODULE_MEMORY_TAG}`;
export const MEMOP_SELECTOR = `*:nth-child(1) > ${MEMOP_TAG}`;
export const reflectElementToObjectTree = (element, parent, root) => {
    if (element instanceof CodePiece) {
        return moduleToObjectTree(element, parent, root);
    }
    // Creating the root for entire source code that has one or many code pieces.
    let obj;
    if (root) {
        if (!(element instanceof ProjectMemory)) {
            throw `Root element must be a project memory`;
        }
        obj = new ObjectNode(reflectElementOps, reflectElementToObjectTree, element);
        for (const memOp of element.memOps) {
            const ext = memOp;
            const created = ext.afterCreation();
            if (created.isFailure) {
                throw created;
            }
        }
    }
    else if (parent !== undefined) {
        obj = new ObjectNode(reflectElementOps, reflectElementToObjectTree, element, parent);
    }
    else {
        throw `Can not create orphan object node in the tree, either make it as a root or pass the parent`;
    }
    if (element instanceof ModuleMemory) {
        element.rest.setRootNode(obj);
    }
    return obj;
};
const getElementTag = (_element) => {
    if (_element === undefined || _element === null || _element instanceof ProjectMemory) {
        return '';
    }
    if (_element instanceof CodePiece) {
        return codePieceOps.getName(_element);
    }
    if (_element instanceof ModuleMemory) {
        return MODULE_MEMORY_TAG;
    }
    // Extension
    return MEMOP_TAG;
};
const getElementChildren = (_element) => {
    if (_element instanceof ModuleMemory) { // Children of module memory is code level
        return _element.rest.rootNode.children;
    }
    else if (_element instanceof CodePiece) {
        return codePieceOps.getChildren(_element);
    }
    else if (_element instanceof ProjectMemory) {
        return _element.memOps;
    }
    // For extensions.
    const moduleMemories = _element.getModules();
    return moduleMemories;
};
const getElementAttribute = (_element, attrName) => {
    if (_element === undefined || _element === null || _element instanceof ProjectMemory) {
        if (attrName === 'id') {
            return DOCUMENT_SELECTOR.substring(1);
        }
        return undefined;
    }
    if (_element instanceof CodePiece) {
        return codePieceOps.getAttribute(_element, attrName);
    }
    if (attrName === "id") {
        if (_element instanceof ModuleMemory) {
            return escapeId(_element.moduleLink.moduleURL);
        }
        else {
            return escapeId(_element.memoryOperatorId.toString());
        }
    }
    else if (attrName === "class") {
        if (_element instanceof ModuleMemory) {
            return _element.moduleCategory;
        }
        else {
            return undefined;
        }
    }
    if (attrName in _element) {
        return _element[attrName]?.toString();
    }
    return undefined;
};
const setElementAttribute = (_element, attrName, attrValue) => {
    if (_element === undefined || _element === null || _element instanceof ProjectMemory) {
        return OkResult.ok();
    }
    if (_element instanceof CodePiece) {
        return codePieceOps.setAttribute(_element, attrName, attrValue);
    }
    const moduleLink = _element instanceof ModuleMemory ? _element.moduleLink.toString() : _element.memoryOperatorId;
    if (attrName === "id") {
        return OkResult.fail(`Can not set id`, `Please dont set id`);
    }
    else if (attrName === "class") {
        return OkResult.fail(`Can not set class`, `Category of the module is pre-defined`);
    }
    if (attrName in _element) {
        _element[attrName] = attrValue;
        return OkResult.ok();
    }
    else {
        return OkResult.fail(`The ${moduleLink} has no attributes`, `Can not set ${attrName} to non attributal element`);
    }
};
export const escapeId = (path) => {
    // const replaced = path.replaceAll(':', '\\3A').replaceAll('/', '\\2F').replaceAll('@', '\\40');
    const replaced = path.replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-').replaceAll('%', '_____-').replaceAll('?', '______-').replaceAll('=', '_______-');
    return replaced;
};
export const reflectElementOps = {
    getName: getElementTag,
    getChildren: getElementChildren,
    getAttribute: getElementAttribute,
    setAttribute: setElementAttribute,
};
