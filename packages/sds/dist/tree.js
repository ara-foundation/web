import { OkResult, ObjectTraits } from "@ara-web/p-hintjens";
export const DOCUMENT_SELECTOR = "#document";
/**
 * ObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 *
 * Using with the `CSSObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export class ObjectNode {
    isTag = true; // legacy, this is needed by CSS-Select package.
    _data; // Only component like data
    _children = [];
    _parent;
    _dataOps;
    constructor(dataOps, dataToObjectNode, data, parent) {
        this._dataOps = dataOps;
        this._children = [];
        this._parent = parent;
        if (data !== undefined) {
            this._data = data;
            const children = dataOps.getChildren(data);
            const parentElement = this;
            // new ObjectNode() lints this object to it's children
            const childNodes = children.map((child) => dataToObjectNode(child, parentElement));
            // lint child to this node.
            this.setChildren(childNodes);
        }
    }
    baseURI;
    childNodes;
    firstChild;
    isConnected;
    lastChild;
    nextSibling;
    nodeName;
    nodeType;
    nodeValue;
    ownerDocument;
    parentElement;
    parentNode;
    previousSibling;
    textContent;
    get selector() {
        if (this._data === undefined) {
            return DOCUMENT_SELECTOR;
        }
        let mySelectorId = this.getAttribute("id") || "";
        if (mySelectorId.length > 0) {
            mySelectorId = `#${mySelectorId}`;
        }
        let mySelectorClasses = this.getAttribute("class") || "";
        if (mySelectorClasses.length > 0) {
            mySelectorClasses = mySelectorClasses.split(" ").map(c => (`.${c.trim()}`)).join("");
        }
        const mySelector = `${this.name}${mySelectorClasses}${mySelectorId}`;
        return this._parent ? `${this._parent.selector} > ${mySelector}` : mySelector;
    }
    appendChild(node) {
        this._children.push(node);
        node.setParent(this);
        return node;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cloneNode(deep) {
        return ObjectTraits.deepCopy(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compareDocumentPosition(other) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contains(other) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRootNode(options) {
        throw new Error("Method not implemented.");
    }
    hasChildNodes() {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    insertBefore(node, child) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isDefaultNamespace(namespace) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isEqualNode(otherNode) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSameNode(otherNode) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lookupNamespaceURI(prefix) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lookupPrefix(namespace) {
        throw new Error("Method not implemented.");
    }
    normalize() {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeChild(child) {
        this._children = this._children.filter(node => node._data !== child);
        return child;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceChild(node, child) {
        throw new Error("Method not implemented.");
    }
    ELEMENT_NODE;
    ATTRIBUTE_NODE;
    TEXT_NODE;
    CDATA_SECTION_NODE;
    ENTITY_REFERENCE_NODE;
    ENTITY_NODE;
    PROCESSING_INSTRUCTION_NODE;
    COMMENT_NODE;
    DOCUMENT_NODE;
    DOCUMENT_TYPE_NODE;
    DOCUMENT_FRAGMENT_NODE;
    NOTATION_NODE;
    DOCUMENT_POSITION_DISCONNECTED;
    DOCUMENT_POSITION_PRECEDING;
    DOCUMENT_POSITION_FOLLOWING;
    DOCUMENT_POSITION_CONTAINS;
    DOCUMENT_POSITION_CONTAINED_BY;
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addEventListener(type, callback, options) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatchEvent(event) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventListener(type, callback, options) {
        throw new Error("Method not implemented.");
    }
    isEqualTo(node) {
        if (!node) {
            return false;
        }
        return this === node;
    }
    get data() {
        return this._data === undefined ? null : this._data;
    }
    set data(data) {
        this._data = data;
    }
    /**
     * For Pages, it returns empty string.
     */
    get name() {
        return this._dataOps.getName(this._data);
    }
    get parent() {
        return this._parent === undefined ? null : this._parent;
    }
    getAttribute(attrName) {
        return this._dataOps.getAttribute(this._data, attrName);
    }
    setAttribute(name, value) {
        if (this._data === undefined) {
            return OkResult.fail(`No internal element`, `Are you sure it can set an attribute?`);
        }
        return this._dataOps.setAttribute(this._data, name, value);
    }
    get children() {
        return this._children;
    }
    get siblings() {
        return this.parent === null ? [this] : this.parent.children;
    }
    deleteChildren() {
        this._children = [];
    }
    toString() {
        throw new Error("Method not implemented.");
    }
    isAttributeExist(attrName) {
        return this._dataOps.getAttribute(this._data, attrName) !== undefined;
    }
    setChildren(children) {
        this._children = children;
    }
    setParent(parent) {
        this._parent = parent;
    }
}
export class ObjectNodeAdapter {
    isTag(elem) {
        return elem.isTag;
    }
    getChildren(elem) {
        return elem.children ? Array.prototype.slice.call(elem.children, 0) : [];
    }
    getParent(elem) {
        return elem.parent;
    }
    removeSubsets(nodes) {
        let idx = nodes.length;
        let node;
        let ancestor;
        let replace;
        // Check if each node (or one of its ancestors) is already contained in the
        // array.
        while (--idx > -1) {
            node = ancestor = nodes[idx];
            // Temporarily remove the node under consideration
            delete nodes[idx];
            replace = true;
            while (ancestor) {
                if (nodes.indexOf(ancestor) > -1) {
                    replace = false;
                    nodes.splice(idx, 1);
                    break;
                }
                ancestor = this.getParent(ancestor);
            }
            // If the node has been found to be unique, re-insert it.
            if (replace) {
                nodes[idx] = node;
            }
        }
        return nodes;
    }
    existsOne(test, elems) {
        return elems.some((elem) => {
            return this.isTag(elem) ?
                test(elem) || this.existsOne(test, this.getChildren(elem)) :
                false;
        });
    }
    getSiblings(elem) {
        const parent = this.getParent(elem);
        return parent ? this.getChildren(parent) : [elem];
    }
    getAttributeValue(elem, name) {
        const attr = elem.getAttribute(name);
        return attr;
    }
    hasAttrib(elem, name) {
        return (elem.getAttribute(name) !== undefined);
    }
    getName(elem) {
        return elem.name.toLocaleLowerCase();
    }
    findOne(test, arr) {
        let elem = null;
        for (let i = 0, l = arr.length; i < l && !elem; i++) {
            if (test(arr[i])) {
                elem = arr[i];
            }
            else {
                const childs = this.getChildren(arr[i]);
                if (childs && childs.length > 0) {
                    elem = this.findOne(test, childs);
                }
            }
        }
        return elem;
    }
    findAll(test, elems) {
        let result = [];
        for (let i = 0, j = elems.length; i < j; i++) {
            if (!this.isTag(elems[i]))
                continue;
            if (test(elems[i])) {
                result.push(elems[i]);
            }
            const childs = this.getChildren(elems[i]);
            if (childs) {
                const foundChildren = this.findAll(test, childs);
                result = result.concat(foundChildren);
            }
        }
        return result;
    }
    getText(elem) {
        if (elem.isTag) {
            return this.getChildren(elem).map(this.getText).join("");
        }
        return elem.nodeValue || "";
    }
}
