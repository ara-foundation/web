import { Debug, ObjectLink } from "../index.js";
import {type Options as CSSOptions, selectAll as cssGetAll, selectOne as cssGet, is as isCssObjectMatchQuery, compile as cssCompile } from "css-select";

export type Predicate<Value> = (v: Value) => boolean;
/**
 * @link https://github.com/fb55/css-select/blob/1aa44bdd64aaf2ebdfd7f338e2e76bed36521957/src/types.ts#L6-L96
 */
export interface Adapter<ObjectNode, BranchedModuleObject extends ObjectNode> {
    /**
     *  Is the node a tag?
     */
    isTag: (node: ObjectNode) => node is BranchedModuleObject;

    /**
     * Does at least one of passed element nodes pass the test predicate?
     */
    existsOne: (test: Predicate<BranchedModuleObject>, elems: ObjectNode[]) => boolean;

    /**
     * Get the attribute value.
     */
    getAttributeValue: (elem: BranchedModuleObject, name: string) => string | undefined;

    /**
     * Get the node's children
     */
    getChildren: (node: ObjectNode) => ObjectNode[];

    /**
     * Get the name of the tag
     */
    getName: (elem: BranchedModuleObject) => string;

    /**
     * Get the parent of the node
     */
    getParent: (node: BranchedModuleObject) => BranchedModuleObject | null;

    /**
     * Get the siblings of the node. Note that unlike jQuery's `siblings` method,
     * this is expected to include the current node as well
     */
    getSiblings: (node: ObjectNode) => ObjectNode[];

    /**
     * Get the text content of the node, and its children if it has any.
     */
    getText: (node: ObjectNode) => string;

    /**
     * Does the element have the named attribute?
     */
    hasAttrib: (elem: BranchedModuleObject, name: string) => boolean;

    /**
     * Takes an array of nodes, and removes any duplicates, as well as any
     * nodes whose ancestors are also in the array.
     */
    removeSubsets: (nodes: ObjectNode[]) => ObjectNode[];

    /**
     * Finds all of the element nodes in the array that match the test predicate,
     * as well as any of their children that match it.
     */
    findAll: (test: Predicate<BranchedModuleObject>, nodes: ObjectNode[]) => BranchedModuleObject[];

    /**
     * Finds the first node in the array that matches the test predicate, or one
     * of its children.
     */
    findOne: (
        test: Predicate<BranchedModuleObject>,
        elems: ObjectNode[]
    ) => BranchedModuleObject | null;

    /**
     * The adapter can also optionally include an equals method, if your DOM
     * structure needs a custom equality test to compare two objects which refer
     * to the same underlying node. If not provided, `css-select` will fall back to
     * `a === b`.
     */
    equals?: (a: ObjectNode, b: ObjectNode) => boolean;

    /**
     * Is the element in hovered state?
     */
    isHovered?: (elem: BranchedModuleObject) => boolean;

    /**
     * Is the element in visited state?
     */
    isVisited?: (elem: BranchedModuleObject) => boolean;

    /**
     * Is the element in active state?
     */
    isActive?: (elem: BranchedModuleObject) => boolean;
}

/** 
 * The object is a name for a part of a file, a web page, a spread sheet, or any form of data content.
 * If you want to create an object link to a custom content, 
 * then implement this `ObjectNode` interface for your data peices.
 * For example:
 * Let's say we run a weekly newspapers that we store in MongoDB. 
 * We want to allow our customers to create a URL with specific part of the newspaper:
 * - to a specific page, 
 * - to a certain article in a page,
 * - to a certain word, sentences or perhaps footnote,
 * 
 * Then, implement the Newspapers'Model as a MongoDocumentObject, then all possible parts
 * as MongoDocumentObject too.
 * 
 * Other use cases:
 * - *to reference elements of HTML files: The Object ObjectNode may be equal to DOM ObjectNode*
 * - *to reference source code's data such as declared variables, functions, types, arrays etc: The Object ObjectNode may be equal to AST ObjectNode*.
 * 
 * Real implementations:
 * The `@ara-web/reflect-astro-ext` package converts Astro Framework based website 
 * into a JSON and vice versa. The website's JSON representation is a tree of `ComponentBranchedNode.
 * 
 * The `ComponentBranchedNode` implements the `ObjectNode`, 
 * which means works with `ObjectLink` and links static traversal methods.
*/
export interface ObjectNode extends Node {
    selector: string;
    isTag: boolean;    // The component html name or component name.
    getAttribute(attr: string): string | undefined;
    children: ObjectNode[];
    parent: ObjectNode | null;
    name: string;
    siblings: ObjectNode[];
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(name: string): boolean;
    isEqualTo(node: ObjectNode | null | undefined): boolean;
}

export class ObjectAdapter<BranchedModuleObject extends ObjectNode> implements Adapter<ObjectNode, BranchedModuleObject>{
    /**
     *  Is the node a tag?
     */
    isTag(node: ObjectNode): node is BranchedModuleObject {
        Debug.log(`ObjectDatapter.isTag: '${node.name}' node is tag?`)
        // All except expression and text are tags
        return node.isTag;
    }
    /**
     * Does at least one of passed element nodes pass the test predicate?
     */
    existsOne(test: Predicate<BranchedModuleObject>, elems: ObjectNode[]): boolean {
        Debug.log(`ObjectDatapter.existsOne: ${elems.length} nodes exist. Predicate:`)
        Debug.log(test);
        for (const el of elems) {
            try {
                const pass = test(el as BranchedModuleObject);
                if (pass) {
                    return true;
                }
                const existsInChildren = this.existsOne(test, el.children);
                if (existsInChildren) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    };
    getAttributeValue(elem: BranchedModuleObject, name: string): string | undefined {
        Debug.log(`ObjectDatapter.getAttributeValue: ${elem.name} node attribute ${name}`)
        return elem.getAttribute(name);
    }
    getChildren(node: ObjectNode): ObjectNode[] {
        Debug.log(`ObjectDatapter.getChildren: ${node.name} children ${node.children.length} amount`)
        
        return node.children
    }
    /**
     * Get name of the tag
     * @param elem 
     * @returns 
     */
    getName(elem: BranchedModuleObject): string {
        Debug.log(`ObjectDatapter.getName: ${elem.name} `)
        
        return elem.name;
    }
    getParent(node: BranchedModuleObject): BranchedModuleObject | null {
        Debug.log(`ObjectDatapter.getParent: ${node.name}`)
        return node.parent === undefined ? null : node.parent as BranchedModuleObject;
    }
    getSiblings(node: ObjectNode): ObjectNode[] {
        Debug.log(`ObjectDatapter.getSiblings: ${node.name}. ${node.siblings.length} amount`)
        
        return node.siblings;
    }
    getText(node: ObjectNode): string {        
        return node.toString();
    }
    hasAttrib(elem: BranchedModuleObject, name: string): boolean {        
        return elem.isAttributeExist(name);
    }
    /**
     * Takes an array of nodes, and removes any duplicates, as well as any
     * nodes whose ancestors are also in the array.
     */
    removeSubsets(nodes: ObjectNode[]): ObjectNode[] {
        let idx = nodes.length;
        let node: ObjectNode;
        let ancestor: ObjectNode | null;
        let replace: boolean;

        // Check if each node (or one of its ancestors) is already contained in the
        // array.
        while(--idx > -1) {
            node = ancestor = nodes[idx];
    
            // Temporarily remove the node under consideration
            //nodes[idx] = null;
            replace = true;
    
            while(ancestor) {
                if(nodes.indexOf(ancestor) > -1) {
                    replace = false;
                    nodes.splice(idx, 1);
                    break;
                }
                ancestor = ancestor.parent
            }
    
            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }
    
        return nodes;
    }
    findAll(test: Predicate<BranchedModuleObject>, nodes: ObjectNode[]): BranchedModuleObject[] {
        Debug.log(`ObjectDatapter.findAll: predicate`)
        Debug.log(test);
        
        const found: BranchedModuleObject[] = [];
        for (const node of nodes) {
            try {
                const pass = test(node as BranchedModuleObject);
                if (pass) {
                    found.push(node as BranchedModuleObject)
                } else {
                    found.push(...this.findAll(test, node.children));
                }
            } catch {
                continue;
            }
        }
        return found;
    }
    findOne(test: Predicate<BranchedModuleObject>, nodes: ObjectNode[]): BranchedModuleObject | null {
        for (const node of nodes) {
            try {
                const pass = test(node as BranchedModuleObject);
                if (pass) {
                    return node as BranchedModuleObject;
                } else {
                    const foundInChildren = this.findOne(test, node.children);
                    if (foundInChildren !== null) {
                        return foundInChildren;
                    }
                }
            } catch {
                continue;
            }
        }
        return null;
    }
    equals(a: ObjectNode, b: ObjectNode): boolean {
        Debug.log(`ObjectAdapter.eqals?`)
        return a.isEqualTo(b);
    };
    isHovered?: ((elem: BranchedModuleObject) => boolean) | undefined;
    isVisited?: ((elem: BranchedModuleObject) => boolean) | undefined;
    isActive?: ((elem: BranchedModuleObject) => boolean) | undefined;
}

export class LinkTraits {
// Queries elems, returns an array containing all matches.
    public static getAll<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: CSSOptions<ObjectNode, BranchedModuleObject>): ObjectNode[] {
        return cssGetAll<ObjectNode, BranchedModuleObject>(query, objects, options);
    }

    public static isObjectMatchQuery<ObjectNode, BranchedModuleObject extends ObjectNode>(node: BranchedModuleObject, query: string, options: CSSOptions<ObjectNode, BranchedModuleObject>): boolean {
        return isCssObjectMatchQuery<ObjectNode, BranchedModuleObject>(node, query, options);
    }

    public static get<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: CSSOptions<ObjectNode, BranchedModuleObject>): ObjectNode | null {
        return cssGet<ObjectNode, BranchedModuleObject>(query, objects, options);
    }

    public static compile<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, options: CSSOptions<ObjectNode, BranchedModuleObject>) {
        const compiled = cssCompile(query, options);
        Debug.log(compiled);
    }
}