import { Debug, OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, DOCUMENT_SELECTOR } from "@ara-web/sds";
import { ModuleMemory } from "./module-memory.js";
import { codePieceOps, MODULE_SELECTOR, moduleToObjectTree } from "./code-piece-object-tree.js";
import { ProjectMemory } from "./project-memory.js";
import { CodePiece } from "./code-level/index.js";
export const MEMOP_TAG = "memop"; // extension tag
export const MODULE_MEMORY_TAG = "module";
export const MODULE_MEMORY_SELECTOR = `*:nth-child(1) ${MODULE_MEMORY_TAG}`;
export const MEMOP_SELECTOR = `*:nth-child(1) > ${MEMOP_TAG}`;
const elementType = (element) => {
    if (element instanceof CodePiece) {
        return `Code Piece('${element.nodeType}#${element.identifier}')`;
    }
    else if (element instanceof ModuleMemory) {
        return `Module Memory('${element.moduleLink.moduleURL}')`;
    }
    else if (element instanceof ProjectMemory) {
        return `Project Memory('${element.memoryOperatorId}')`;
    }
    else if ("memoryOperatorId" in element) {
        return `Extension('${element.memoryOperatorId}')`;
    }
    return 'unknown';
};
export const reflectElementToObjectTree = (element, parent, root) => {
    if (element instanceof CodePiece) {
        return moduleToObjectTree(element, parent, root);
    }
    Debug.log(`Convert '${elementType(element)}' to object tree...`);
    // Creating the root for entire source code that has one or many code pieces.
    let obj;
    if (root) {
        Debug.push(`Project memory as a root node`);
        obj = new ObjectNode(reflectElementOps, reflectElementToObjectTree);
        Debug.pop();
    }
    else if (parent !== undefined) {
        Debug.push(`Child node`);
        Debug.log(`The '${elementType(element)}' is child node of ${parent.selector}`);
        obj = new ObjectNode(reflectElementOps, reflectElementToObjectTree, element, parent);
        Debug.pop();
    }
    else {
        throw `Can not create orphan object node in the tree, either make it as a root or pass the parent`;
    }
    // if ("memoryOperatorId" in element) { // Extension?
    // 	// module memory is a child of extension (module operator)
    // Debug.log(`Lint module memories with extension`)
    // 	const memOpChildren = reflectElementOps.getChildren(element);
    // 	Debug.log(`Extension has ${memOpChildren.length}`)
    // 	// if (memOpChildren.length > 0) {
    // 		// memOpChildren.forEach(element => (element as ModuleMemory<unknown>).rest.setRootNode(obj as any as ObjectNode<CodePiece>));
    // 		// Debug.log(`Extension has children, are they module memory? ${memOpChildren[0] instanceof ModuleMemory}`)
    // 	// }
    // 	// memOpChildren.forEach(moduleMemory => reflectElementOps.getChildren(moduleMemory))
    // 	Debug.push(`new ObjectNode(module memory)`)
    // 	const memoryModules = memOpChildren.map((slotEl) => new ObjectNode<ReflectElementType>(reflectElementOps
    // 	, slotEl, obj
    // 	));
    // 	Debug.pop();
    // 	obj.setChildren(memoryModules);
    // 	// Debug.log(`Module memories of extensions have the module memory as its root?`)
    // 	// Debug.log(`Creating object node of extension with root: ${memoryModules.length}`, memoryModules.map(reflectElement => ((reflectElement.getElement()! as ModuleMemory<unknown>).rest.rootNode.selector)))
    // } else 
    if (element instanceof ModuleMemory) {
        // 	Debug.log(`Converting module memory into object tree`, `Setting module memory's rest as a branch of reflect rest`);
        // 	// Debug.log(`Object root ${element.rest.rootNode.selector} => ${obj.selector}`)
        element.rest.setRootNode(obj);
    }
    return obj;
};
const getElementTag = (_element) => {
    if (_element === undefined || _element === null || _element instanceof ProjectMemory) {
        return DOCUMENT_SELECTOR;
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
    Debug.log(`Get ${elementType(_element)} children`);
    if (_element instanceof ModuleMemory) { // Children of module memory is code level
        return _element.rest.rootNode.children;
    }
    else if (_element instanceof CodePiece) {
        // 	Debug.log(`Code Piece elem`)
        return codePieceOps.getChildren(_element);
    }
    else if (_element instanceof ProjectMemory) {
        return _element.memOps;
    }
    // For Module operators
    const moduleMemories = _element.getModules();
    return moduleMemories;
};
const getElementAttribute = (_element, attrName) => {
    if (_element === undefined || _element === null || _element instanceof ProjectMemory) {
        if (attrName === 'id') {
            return DOCUMENT_SELECTOR;
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
const escapeId = (path) => {
    // const replaced = path.replaceAll(':', '\\3A').replaceAll('/', '\\2F').replaceAll('@', '\\40');
    const replaced = path.replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-');
    return replaced;
};
export const reflectElementOps = {
    getName: getElementTag,
    getChildren: getElementChildren,
    getAttribute: getElementAttribute,
    setAttribute: setElementAttribute,
};
