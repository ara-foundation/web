import { Debug, ObjectLink } from "../index.js";
import { selectAll as cssGetAll, selectOne as cssGet, is as isCssObjectMatchQuery, compile as cssCompile } from "css-select";
export class ObjectAdapter {
    /**
     *  Is the node a tag?
     */
    isTag(node) {
        Debug.log(`ObjectDatapter.isTag: '${node.name}' node is tag?`);
        // All except expression and text are tags
        return node.isTag;
    }
    /**
     * Does at least one of passed element nodes pass the test predicate?
     */
    existsOne(test, elems) {
        Debug.log(`ObjectDatapter.existsOne: ${elems.length} nodes exist. Predicate:`);
        Debug.log(test);
        for (const el of elems) {
            try {
                const pass = test(el);
                if (pass) {
                    return true;
                }
                const existsInChildren = this.existsOne(test, el.children);
                if (existsInChildren) {
                    return true;
                }
            }
            catch {
                continue;
            }
        }
        return false;
    }
    ;
    getAttributeValue(elem, name) {
        Debug.log(`ObjectDatapter.getAttributeValue: ${elem.name} node attribute ${name}`);
        return elem.getAttribute(name);
    }
    getChildren(node) {
        Debug.log(`ObjectDatapter.getChildren: ${node.name} children ${node.children.length} amount`);
        return node.children;
    }
    /**
     * Get name of the tag
     * @param elem
     * @returns
     */
    getName(elem) {
        Debug.log(`ObjectDatapter.getName: ${elem.name} `);
        return elem.name;
    }
    getParent(node) {
        Debug.log(`ObjectDatapter.getParent: ${node.name}`);
        return node.parent === undefined ? null : node.parent;
    }
    getSiblings(node) {
        Debug.log(`ObjectDatapter.getSiblings: ${node.name}. ${node.siblings.length} amount`);
        return node.siblings;
    }
    getText(node) {
        return node.toString();
    }
    hasAttrib(elem, name) {
        return elem.isAttributeExist(name);
    }
    /**
     * Takes an array of nodes, and removes any duplicates, as well as any
     * nodes whose ancestors are also in the array.
     */
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
            //nodes[idx] = null;
            replace = true;
            while (ancestor) {
                if (nodes.indexOf(ancestor) > -1) {
                    replace = false;
                    nodes.splice(idx, 1);
                    break;
                }
                ancestor = ancestor.parent;
            }
            // If the node has been found to be unique, re-insert it.
            if (replace) {
                nodes[idx] = node;
            }
        }
        return nodes;
    }
    findAll(test, nodes) {
        Debug.log(`ObjectDatapter.findAll: predicate`);
        Debug.log(test);
        const found = [];
        for (const node of nodes) {
            try {
                const pass = test(node);
                if (pass) {
                    found.push(node);
                }
                else {
                    found.push(...this.findAll(test, node.children));
                }
            }
            catch {
                continue;
            }
        }
        return found;
    }
    findOne(test, nodes) {
        for (const node of nodes) {
            try {
                const pass = test(node);
                if (pass) {
                    return node;
                }
                else {
                    const foundInChildren = this.findOne(test, node.children);
                    if (foundInChildren !== null) {
                        return foundInChildren;
                    }
                }
            }
            catch {
                continue;
            }
        }
        return null;
    }
    equals(a, b) {
        Debug.log(`ObjectAdapter.eqals?`);
        return a.isEqualTo(b);
    }
    ;
    isHovered;
    isVisited;
    isActive;
}
export class LinkTraits {
    // Queries elems, returns an array containing all matches.
    static getAll(query, objects, options) {
        return cssGetAll(query, objects, options);
    }
    static isObjectMatchQuery(node, query, options) {
        return isCssObjectMatchQuery(node, query, options);
    }
    static get(query, objects, options) {
        return cssGet(query, objects, options);
    }
    static compile(query, options) {
        const compiled = cssCompile(query, options);
        Debug.log(compiled);
    }
}
