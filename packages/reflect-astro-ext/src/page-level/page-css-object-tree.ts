import { OkResult } from "@ara-web/p-hintjens";
import { DOCUMENT_SELECTOR, type ElementOp, ObjectNode, type ObjectToNodeTree } from "@ara-web/sds";
import type { ModuleLink, SlotElement, Slots } from "../index.js";
import type { ReflectLink } from "@ara-web/reflect/code-level";
import type { ValueType } from "@ara-web/reflect/code-level";

// {slots: page.slots} as SlotElement
export const pageToNodeTree: ObjectToNodeTree<SlotElement> = (slotElement: SlotElement): ObjectNode<SlotElement> => {
	const doc = new ObjectNode<SlotElement>(slotElementOps);
	const children = slotElementOps.getChildren(slotElement).map((slotEl) => new ObjectNode<SlotElement>(slotElementOps
		, slotEl, doc
	));
	doc.setChildren(children);
	return doc;
}

/**
	 * For Pages, it returns empty string.
	 */
const getSlotElementName = (_element?: SlotElement): string => {
	if (_element === undefined) {
		return DOCUMENT_SELECTOR;
	}
	let name = "";
	if (_element && "link" in _element) {
		name = _element.link.getTag() || "";
	}
		
	return name;
}
	
const getSlotElementAttribute = (_element: SlotElement | undefined, attrName: string): string | undefined => {
	if (_element === undefined) {
		return undefined;
	}
	if (attrName === "componentClass") {
		if ("componentClass" in _element) {
			return _element.componentClass.moduleURL
		} else {
			return undefined;
		}
	}
	if (attrName === "class") {
		if (_element && "link" in _element) {
			const classes = _element.link.getClass();
			if (Array.isArray(classes)) {
				return classes.join(" ");
			}
			return classes;
		} else {
			return undefined;
		}
	}
	if (_element === undefined) {
		return undefined;
	}
	if ("attributes" in _element) {
		if (attrName in _element.attributes) {
			const attr = _element.attributes[attrName].toString();
			return attr;
		}
	}
	return undefined;
}

const setSlotElementAttribute = <AttrType>(_element: SlotElement | undefined, attrName: string, attrValue: AttrType): OkResult => {
	if (_element === undefined) {
		return OkResult.ok();
	}
	if (attrName === "componentClass") {
		if ("componentClass" in _element) {
			const classComponent: ModuleLink = attrValue as ModuleLink;
			_element.componentClass = classComponent;
			return OkResult.ok();
		} else {
			return OkResult.fail(`The element doesn't have 'componentClass'`, `Can not set component class since element doesn't have it`);
		}
	}
	if (attrName === "class") {
		if (_element && "link" in _element) {
			const classValue = attrValue as string;
			const classes = classValue.split(" ");
			_element.link.setClasses(classes);
			return OkResult.ok();
		} else {
			return OkResult.fail(`The element doesn't have a link`, `Please use correct element`);
		}
	}
	if ("attributes" in _element) {
		_element.attributes[attrName] = attrValue as ReflectLink | ValueType;
		return OkResult.ok();
	} else {
		return OkResult.fail(`The ${_element.link} has no attributes`, `Can not set ${attrName} to non attributal element`)
	}
}

const getSlotElementChildren = (el: SlotElement): SlotElement[] => {
	if (el === undefined) {
		return []//doc;
	}
	let slots: Slots;
	if ("slots" in el) {
		slots = el.slots;
	} else {
		return []//doc;
	}
	const children = [...Object.values(slots).reduce((acc, curr) => acc.concat(curr), [])]
	return children//doc;
}

export const slotElementOps: ElementOp<SlotElement> = {
	getChildren: getSlotElementChildren,
	getAttribute: getSlotElementAttribute,
	getName: getSlotElementName,
	setAttribute: setSlotElementAttribute,
}

