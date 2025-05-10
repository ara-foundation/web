import { PageObjectNode } from "./page-object-node.js";
export const pageToObjectNodes = (slots) => {
    const doc = new PageObjectNode();
    const children = PageObjectNode.getSlotChildren(slots);
    doc.setChildren(children);
    return [doc];
};
export class PageObjectAdapter {
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
