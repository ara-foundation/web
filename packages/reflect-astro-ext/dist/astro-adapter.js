/* eslint-disable @typescript-eslint/no-unused-vars */
import { AstroNode } from "./astro-node.js";
import { ObjectTraits } from "@ara-web/p-hintjens";
export class AstroObjectNode {
    selector;
    isTag;
    _node;
    _children;
    _parent;
    constructor(node, parent) {
        this._children = [];
        this._parent = parent;
        if (node === undefined) {
            this.selector = "";
            this.isTag = true;
        }
        else {
            this._node = node;
            this.selector = parent ? `${parent.selector} > ${node.name}` : node.name;
            this.isTag = node.isComponent || node.isHTMLElement;
            for (const child of node.children) {
                const childNode = new AstroObjectNode(child, this);
                this._children.push(childNode);
            }
        }
    }
    get parent() {
        return this._parent === undefined ? null : this._parent;
    }
    static newPageObjectNode() {
        return new AstroObjectNode();
    }
    getAttribute(attrName) {
        if (this._node === undefined) {
            return undefined;
        }
        for (const attr of this._node.attributes) {
            if (attr.name === attrName) {
                return attr.value;
            }
        }
        return undefined;
    }
    get children() {
        return this._children;
    }
    get name() {
        if (this._node === undefined) {
            return `#document`;
        }
        return this._node.name;
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
        if (this._node === undefined) {
            return false;
        }
        for (const attr of this._node.attributes) {
            if (attr.name === attrName) {
                return true;
            }
        }
        return false;
    }
    isEqualTo(node) {
        return node?.selector === this.selector;
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
    appendChild(node) {
        this._children.push(node);
        return node;
    }
    cloneNode(deep) {
        return ObjectTraits.deepCopy(this);
    }
    compareDocumentPosition(other) {
        throw new Error("Method not implemented.");
    }
    contains(other) {
        throw new Error("Method not implemented.");
    }
    getRootNode(options) {
        throw new Error("Method not implemented.");
    }
    hasChildNodes() {
        return this._children.length > 0;
    }
    insertBefore(node, child) {
        throw new Error("Method not implemented.");
    }
    isDefaultNamespace(namespace) {
        throw new Error("Method not implemented.");
    }
    isEqualNode(otherNode) {
        throw new Error("Method not implemented.");
    }
    isSameNode(otherNode) {
        throw new Error("Method not implemented.");
    }
    lookupNamespaceURI(prefix) {
        throw new Error("Method not implemented.");
    }
    lookupPrefix(namespace) {
        throw new Error("Method not implemented.");
    }
    normalize() {
        throw new Error("Method not implemented.");
    }
    removeChild(child) {
        throw new Error("Method not implemented.");
    }
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
    addEventListener(type, callback, options) {
        throw new Error("Method not implemented.");
    }
    dispatchEvent(event) {
        throw new Error("Method not implemented.");
    }
    removeEventListener(type, callback, options) {
        throw new Error("Method not implemented.");
    }
}
export const astroNodesToObjectNodes = (nodes) => {
    const objs = [];
    const parent = AstroObjectNode.newPageObjectNode();
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const obj = new AstroObjectNode(node, parent);
        objs.push(obj);
        parent.appendChild(obj);
    }
    return objs;
};
export class AstroNodeAdapter {
    EMPTY_OBJECT = {};
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
        return elem.getAttribute(name);
    }
    hasAttrib(elem, name) {
        return elem.getAttribute(name) !== undefined;
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
        if (this.isTag(elem))
            return this.getChildren(elem).map(this.getText).join("");
        if (elem.nodeType === 3)
            return elem.nodeValue || "";
        return "";
    }
}
