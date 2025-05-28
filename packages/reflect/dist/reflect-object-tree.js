import { OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, DOCUMENT_SELECTOR, RestfulExtensionOperator } from "@ara-web/sds";
import { Module } from "./module.js";
export const MEMOP_TAG = "memop"; // extension tag
export const MODULE_MEMORY_TAG = "module";
export const MODULE_MEMORY_SELECTOR = `*:nth-child(1) ${MODULE_MEMORY_TAG}`;
export const MEMOP_SELECTOR = `*:nth-child(1) > ${MEMOP_TAG}`;
export const reflectDataToObjectTree = (data, parent) => {
    // if (data instanceof CodePiece) {
    // 	return moduleToCodePieceTree(data, parent as ObjectNode<CodePiece>);
    // }
    // Creating the root for entire source code that has one or many code pieces.
    let obj;
    if (parent === undefined) {
        if (!(data instanceof RestfulExtensionOperator)) {
            throw `Root element must be an extension operator`;
        }
        obj = new ObjectNode(reflectElementOps, reflectDataToObjectTree, data);
    }
    else {
        obj = new ObjectNode(reflectElementOps, reflectDataToObjectTree, data, parent);
    }
    // if (data instanceof ModuleMemory) {
    // 	data.rest.setRootNode(obj as any as ObjectNode<CodePiece>);
    // } 
    return obj;
};
const getName = (data) => {
    if (data === undefined || data === null || data instanceof RestfulExtensionOperator) {
        return '';
    }
    // if (data instanceof CodePiece) {
    // 	return codePieceOps.getName(data);
    // }
    if (data instanceof Module) {
        return MODULE_MEMORY_TAG;
    }
    // Extension
    return MEMOP_TAG;
};
const getChildren = (data) => {
    if (data instanceof Module) { // Children of module memory is code level
        return [];
        // return data.rest.rootNode.children as unknown as ReflectDataType[];
        // } else if (data instanceof CodePiece) {
        // return codePieceOps.getChildren(data);
    }
    else if (data instanceof RestfulExtensionOperator) {
        return data.exts;
    }
    // For extensions.
    const moduleMemories = data.getModules();
    return moduleMemories;
};
const getAttribute = (data, attrName) => {
    if (data === undefined || data === null || data instanceof RestfulExtensionOperator) {
        if (attrName === 'id') {
            return DOCUMENT_SELECTOR.substring(1);
        }
        return undefined;
    }
    // if (data instanceof CodePiece) {
    // 	return codePieceOps.getAttribute(data, attrName);
    // }
    if (attrName === "id") {
        if (data instanceof Module) {
            return escapeId(data.link.url);
        }
        else {
            return escapeId(data.packageLink.toString());
        }
    }
    else if (attrName === "class") {
        if (data instanceof Module) {
            return data.category;
        }
        else {
            return undefined;
        }
    }
    if (attrName in data) {
        return data[attrName]?.toString();
    }
    return undefined;
};
const setAttribute = (data, attrName, attrValue) => {
    if (data === undefined || data === null || data instanceof RestfulExtensionOperator) {
        return OkResult.ok();
    }
    // if (data instanceof CodePiece) {
    // 	return codePieceOps.setAttribute<AttrType>(data, attrName, attrValue);
    // }
    const moduleLink = data instanceof Module ? data.link.toString() : data.packageLink;
    if (attrName === "id") {
        return OkResult.fail(`Can not set id`, `Please dont set id`);
    }
    else if (attrName === "class") {
        return OkResult.fail(`Can not set class`, `Category of the module is pre-defined`);
    }
    if (attrName in data) {
        data[attrName] = attrValue;
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
    getName,
    getChildren,
    getAttribute,
    setAttribute,
};
