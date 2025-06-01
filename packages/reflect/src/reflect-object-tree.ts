import { OkResult } from "@ara-web/p-hintjens";
import { type DataToObjectNode, type DataOperations, ObjectNode, DOCUMENT_SELECTOR, RestfulExtensionOperator } from "@ara-web/sds";
import { Module } from "./module.js";
// import { codePieceOps, moduleToCodePieceTree } from "./code-piece-object-tree.js";
import type { ModuleManager } from "./module-manager.js";

export type ReflectDataType = Module | ModuleManager | RestfulExtensionOperator;

export const MEMOP_TAG = "memop"; // extension tag
export const MODULE_MEMORY_TAG = "module";
export const MODULE_MEMORY_SELECTOR = `*:nth-child(1) ${MODULE_MEMORY_TAG}`;
export const MEMOP_SELECTOR = `*:nth-child(1) > ${MEMOP_TAG}`;

export const reflectDataToObjectTree: DataToObjectNode<ReflectDataType> = (data?: ReflectDataType, parent?: ObjectNode<ReflectDataType>): ObjectNode<ReflectDataType> => {
	// Creating the root for entire source code that has one or many code pieces.
	const obj = new ObjectNode<ReflectDataType>(reflectElementOps, reflectDataToObjectTree, data, parent);
	return obj;
}

const getName = (data?: ReflectDataType): string => {
	if (data === undefined || data === null || data instanceof RestfulExtensionOperator) {
		return '';
	}
	if (data instanceof Module) {
		return MODULE_MEMORY_TAG;
	}
	// Extension
	return MEMOP_TAG;
}

const getChildren = (data: ReflectDataType): ReflectDataType[] => {
	if (data instanceof Module) {	// Children of module memory is code level
		return [];
		// return data.rest.rootNode.children as unknown as ReflectDataType[];
	// } else if (data instanceof CodePiece) {
		// return codePieceOps.getChildren(data);
	} else if (data instanceof RestfulExtensionOperator) {
		return data.extensions as ModuleManager[];
	}
	// For extensions.
	const moduleMemories = data.getModules();
	return moduleMemories
}

const getAttribute = (data: ReflectDataType | undefined, attrName: string): string | undefined => {
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
		} else {
			return escapeId(data.packageLink.toString());
		}
		
	} else if (attrName === "class") {
		if (data instanceof Module) {
			return data.category;
		} else {
			return undefined;
		}
	}
	
	if (attrName in data) {
		return (data as any)[attrName]?.toString();
	}
	return undefined;
}

const setAttribute = <AttrType>(data: ReflectDataType | undefined, attrName: string, attrValue: AttrType): OkResult => {
	if (data === undefined || data === null || data instanceof RestfulExtensionOperator) {
		return OkResult.ok();
	}
	// if (data instanceof CodePiece) {
	// 	return codePieceOps.setAttribute<AttrType>(data, attrName, attrValue);
	// }
	const moduleLink = data instanceof Module ? data.link.toString() : data.packageLink;
	if (attrName === "id") {
		return OkResult.fail(`Can not set id`, `Please dont set id`);
	} else if (attrName === "class") {
		return OkResult.fail(`Can not set class`, `Category of the module is pre-defined`);
	}
	if (attrName in data) {
		(data as any)[attrName] = attrValue;
		return OkResult.ok();
	} else {
		return OkResult.fail(`The ${moduleLink} has no attributes`, `Can not set ${attrName} to non attributal element`)
	}
}

export const escapeId = (path: string): string => {
	// const replaced = path.replaceAll(':', '\\3A').replaceAll('/', '\\2F').replaceAll('@', '\\40');
	const replaced = path.replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-').replaceAll('%', '_____-').replaceAll('?', '______-').replaceAll('=', '_______-');
	return replaced;
}

export const reflectElementOps: DataOperations<ReflectDataType> = {
	getName,
	getChildren,
	getAttribute,
	setAttribute,
}
