import { ObjectTraits } from "@ara-web/p-hintjens";
/**
 * PageObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 *
 * Using with the `PageObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export class PageObjectNode {
    selector;
    isTag;
    _element; // Only component like data
    _children = [];
    _parent;
    constructor(node, parent) {
        this._children = [];
        this._parent = parent;
        if (node === undefined) {
            this.selector = "#document";
            this.isTag = true;
        }
        else {
            this._element = node;
            this.selector = parent ? `${parent.selector} > ${this.getSelector(node)}` : this.getSelector();
            this.isTag = true;
            if ("slots" in node) {
                const children = PageObjectNode.getSlotChildren(node.slots);
                this.setChildren(children);
            }
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
    static newPageObjectNode(slots) {
        const children = PageObjectNode.getSlotChildren(slots);
        const doc = new PageObjectNode();
        doc.setChildren(children);
        return doc;
    }
    appendChild(node) {
        this._children.push(node);
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
        throw new Error("Method not implemented.");
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
        // Compare selectors
        if (this.selector !== node.selector) {
            return false;
        }
        // Compare names (if available)
        if (this.name !== node.name) {
            return false;
        }
        return true;
    }
    getSelector(element) {
        if (element && "link" in element) {
            return element.link.getTag() || "";
        }
        return "";
    }
    /**
     * For Pages, it returns empty string.
     */
    get name() {
        if (this._element === undefined) {
            return "#document";
        }
        let name = "";
        if (this._element && "link" in this._element) {
            name = this._element.link.getTag() || "";
        }
        return name;
    }
    get parent() {
        return this._parent === undefined ? null : this._parent;
    }
    getAttribute(attrName) {
        if (this._element === undefined) {
            return undefined;
        }
        if ("attributes" in this._element) {
            if (attrName in this._element.attributes) {
                const attr = this._element.attributes[attrName].toString();
                return attr;
            }
        }
        return undefined;
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
        if (this._element === undefined) {
            return false;
        }
        if ("attributes" in this._element) {
            for (const elAttr in this._element.attributes) {
                if (elAttr === attrName) {
                    return true;
                }
            }
        }
        return false;
    }
    setChildren(children) {
        for (const childIndex in children) {
            const child = new PageObjectNode(children[childIndex], this);
            this._children.push(child);
        }
    }
    static getSlotChildren(slots) {
        return [...Object.values(slots).reduce((acc, curr) => acc.concat(curr), [])];
    }
}
