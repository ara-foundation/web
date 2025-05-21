import { OkResult } from "@ara-web/p-hintjens";
import { DOCUMENT_SELECTOR, ObjectNode } from "@ara-web/sds";
// {slots: page.slots} as SlotElement
export const pageToNodeTree = (slotElement, parent, root) => {
    let doc;
    if (root) {
        doc = new ObjectNode(slotElementOps, pageToNodeTree);
        const children = slotElementOps.getChildren(slotElement).map((slotEl) => new ObjectNode(slotElementOps, pageToNodeTree, slotEl, doc));
        doc.setChildren(children);
    }
    else {
        if (parent === undefined) {
            throw `No root object must have parent, parent not passed`;
        }
        doc = new ObjectNode(slotElementOps, pageToNodeTree, slotElement, parent);
    }
    return doc;
};
/**
     * For Pages, it returns empty string.
     */
const getSlotElementName = (_element) => {
    if (_element === undefined) {
        return DOCUMENT_SELECTOR;
    }
    let name = "";
    if (_element && "link" in _element) {
        name = _element.link.getTag() || "";
    }
    return name;
};
const getSlotElementAttribute = (_element, attrName) => {
    if (_element === undefined) {
        return undefined;
    }
    if (attrName === "componentClass") {
        if ("componentClass" in _element) {
            return _element.componentClass.moduleURL;
        }
        else {
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
        }
        else {
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
};
const setSlotElementAttribute = (_element, attrName, attrValue) => {
    if (_element === undefined) {
        return OkResult.ok();
    }
    if (attrName === "componentClass") {
        if ("componentClass" in _element) {
            const classComponent = attrValue;
            _element.componentClass = classComponent;
            return OkResult.ok();
        }
        else {
            return OkResult.fail(`The element doesn't have 'componentClass'`, `Can not set component class since element doesn't have it`);
        }
    }
    if (attrName === "class") {
        if (_element && "link" in _element) {
            const classValue = attrValue;
            const classes = classValue.split(" ");
            _element.link.setClasses(classes);
            return OkResult.ok();
        }
        else {
            return OkResult.fail(`The element doesn't have a link`, `Please use correct element`);
        }
    }
    if ("attributes" in _element) {
        _element.attributes[attrName] = attrValue;
        return OkResult.ok();
    }
    else {
        return OkResult.fail(`The ${_element.link} has no attributes`, `Can not set ${attrName} to non attributal element`);
    }
};
const getSlotElementChildren = (el) => {
    if (el === undefined) {
        return []; //doc;
    }
    let slots;
    if ("slots" in el) {
        slots = el.slots;
    }
    else {
        return []; //doc;
    }
    const children = [...Object.values(slots).reduce((acc, curr) => acc.concat(curr), [])];
    return children; //doc;
};
export const slotElementOps = {
    getChildren: getSlotElementChildren,
    getAttribute: getSlotElementAttribute,
    getName: getSlotElementName,
    setAttribute: setSlotElementAttribute,
};
