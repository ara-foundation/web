import {} from "@ara-web/p-hintjens";
/**
 * The `NodeAdapter` is an adapter for the DOM Node interface.
 * Interact with the DOM elements using CSS.
 * Combined with the `@ara-web/p-hintjens/rest` package, it can be used to
 * interact with the DOM elements using CSS selectors.
 */
export class NodeAdapter {
    EMPTY_OBJECT = {};
    isTag(elem) {
        return elem.nodeType === 1;
    }
    getChildren(elem) {
        return elem.childNodes ? Array.prototype.slice.call(elem.childNodes, 0) : [];
    }
    getParent(elem) {
        return elem.parentNode;
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
        if (elem.hasAttribute && elem.hasAttribute(name)) {
            const attr = elem.getAttribute(name);
            return attr !== null ? attr : undefined;
        }
        else if (name === "class" && elem.classList) {
            return Array.from(elem.classList).join(" ");
        }
    }
    hasAttrib(elem, name) {
        return name in (elem.attributes || this.EMPTY_OBJECT);
    }
    getName(elem) {
        return (elem.tagName || "").toLowerCase();
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
