import * as CSSWhat from "css-what";
import { OkResult } from "@ara-web/p-hintjens";
import { type Options as CSSOptions } from "css-select";
export type ObjectToNodeTree<T> = (obj: T, parent?: ObjectNode<T>, root?: boolean) => ObjectNode<T>;
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
export interface ObjectNodeInterface extends Node {
    selector: string;
    isTag: boolean;
    getAttribute(attr: string): string | undefined;
    children: ObjectNodeInterface[];
    parent: ObjectNodeInterface | null;
    name: string;
    siblings: ObjectNodeInterface[];
    getElement: () => unknown | null;
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(name: string): boolean;
    isEqualTo(node: ObjectNodeInterface | null | undefined): boolean;
    setChildren(children: ObjectNodeInterface[]): void;
    setParent(parent: ObjectNodeInterface): void;
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult;
}
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
    findOne: (test: Predicate<BranchedModuleObject>, elems: ObjectNode[]) => BranchedModuleObject | null;
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
export type ElementOp<T> = {
    getChildren(obj?: T): T[];
    getAttribute(obj: T | undefined, attrName: string): string | undefined;
    getName(obj?: T): string;
    setAttribute<AttrValue>(obj: T, attrName: string, attrValue: AttrValue): OkResult;
};
/**
 * ObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 *
 * Using with the `CSSObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export declare class ObjectNode<ElementType> implements ObjectNodeInterface {
    isTag: boolean;
    private _element?;
    private _children;
    private _parent?;
    private elementOp;
    constructor(elementOp: ElementOp<ElementType>, element?: ElementType, parent?: ObjectNodeInterface);
    baseURI: string;
    childNodes: NodeListOf<ChildNode>;
    firstChild: ChildNode | null;
    isConnected: boolean;
    lastChild: ChildNode | null;
    nextSibling: ChildNode | null;
    nodeName: string;
    nodeType: number;
    nodeValue: string | null;
    ownerDocument: Document | null;
    parentElement: HTMLElement | null;
    parentNode: ParentNode | null;
    previousSibling: ChildNode | null;
    textContent: string | null;
    get selector(): string;
    appendChild<T extends Node>(node: T): T;
    cloneNode(deep?: boolean): Node;
    compareDocumentPosition(other: Node): number;
    contains(other: Node | null): boolean;
    getRootNode(options?: GetRootNodeOptions): Node;
    hasChildNodes(): boolean;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    isDefaultNamespace(namespace: string | null): boolean;
    isEqualNode(otherNode: Node | null): boolean;
    isSameNode(otherNode: Node | null): boolean;
    lookupNamespaceURI(prefix: string | null): string | null;
    lookupPrefix(namespace: string | null): string | null;
    normalize(): void;
    removeChild<T extends Node>(child: T): T;
    replaceChild<T extends Node>(node: Node, child: T): T;
    ELEMENT_NODE: 1;
    ATTRIBUTE_NODE: 2;
    TEXT_NODE: 3;
    CDATA_SECTION_NODE: 4;
    ENTITY_REFERENCE_NODE: 5;
    ENTITY_NODE: 6;
    PROCESSING_INSTRUCTION_NODE: 7;
    COMMENT_NODE: 8;
    DOCUMENT_NODE: 9;
    DOCUMENT_TYPE_NODE: 10;
    DOCUMENT_FRAGMENT_NODE: 11;
    NOTATION_NODE: 12;
    DOCUMENT_POSITION_DISCONNECTED: 1;
    DOCUMENT_POSITION_PRECEDING: 2;
    DOCUMENT_POSITION_FOLLOWING: 4;
    DOCUMENT_POSITION_CONTAINS: 8;
    DOCUMENT_POSITION_CONTAINED_BY: 16;
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32;
    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
    dispatchEvent(event: Event): boolean;
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
    isEqualTo(node: ObjectNodeInterface | null | undefined): boolean;
    getElement(): ElementType | null;
    /**
     * For Pages, it returns empty string.
     */
    get name(): string;
    get parent(): ObjectNodeInterface | null;
    getAttribute(attrName: string): string | undefined;
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult;
    get children(): ObjectNodeInterface[];
    get siblings(): ObjectNodeInterface[];
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(attrName: string): boolean;
    setChildren(children: ObjectNodeInterface[]): void;
    setParent(parent: ObjectNodeInterface): void;
}
export type Predicate<Value> = (v: Value) => boolean;
export declare const DOCUMENT_SELECTOR = "#document";
export declare class LinkTraits {
    static getAll<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: CSSOptions<ObjectNode, BranchedModuleObject>): ObjectNode[];
    static isObjectMatchQuery<ObjectNode, BranchedModuleObject extends ObjectNode>(node: BranchedModuleObject, query: string, options: CSSOptions<ObjectNode, BranchedModuleObject>): boolean;
    static get<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: CSSOptions<ObjectNode, BranchedModuleObject>): ObjectNode | null;
    static compile<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, options: CSSOptions<ObjectNode, BranchedModuleObject>): void;
    static parseSelector(query: string): CSSWhat.Selector[][];
    static isAttributeSelector(query: string): boolean;
    static getAttributeName(query: string): string | null;
    static trimAttribute(query: string): string;
}
export declare class CSSObjectAdapter<ElementType> implements Adapter<ObjectNodeInterface, ObjectNode<ElementType>> {
    isTag(elem: ObjectNodeInterface): elem is ObjectNode<ElementType>;
    getChildren(elem: ObjectNodeInterface): ObjectNodeInterface[];
    getParent(elem: ObjectNode<ElementType>): ObjectNode<ElementType> | null;
    removeSubsets(nodes: ObjectNodeInterface[]): ObjectNodeInterface[];
    existsOne(test: Predicate<ObjectNode<ElementType>>, elems: ObjectNodeInterface[]): boolean;
    getSiblings(elem: ObjectNodeInterface): ObjectNodeInterface[];
    getAttributeValue(elem: ObjectNode<ElementType>, name: string): string | undefined;
    hasAttrib(elem: ObjectNode<ElementType>, name: string): boolean;
    getName(elem: ObjectNode<ElementType>): string;
    findOne(test: Predicate<ObjectNode<ElementType>>, arr: ObjectNodeInterface[]): ObjectNode<ElementType> | null;
    findAll(test: Predicate<ObjectNode<ElementType>>, elems: ObjectNodeInterface[]): ObjectNode<ElementType>[];
    getText(elem: ObjectNodeInterface): string;
}
