import { type ObjectNode } from "@ara-web/p-hintjens";
import type { SlotElement, Slots } from "../index.js";
/**
 * PageObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 *
 * Using with the `PageObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export declare class PageObjectNode implements ObjectNode {
    selector: string;
    isTag: boolean;
    private _element?;
    private _children;
    private _parent?;
    constructor(node?: SlotElement, parent?: ObjectNode);
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
    static newPageObjectNode(slots: Slots): PageObjectNode;
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
    isEqualTo(node: ObjectNode | null | undefined): boolean;
    private getSelector;
    /**
     * For Pages, it returns empty string.
     */
    get name(): string;
    get parent(): ObjectNode | null;
    getAttribute(attrName: string): string | undefined;
    get children(): ObjectNode[];
    get siblings(): ObjectNode[];
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(attrName: string): boolean;
    setChildren(children: SlotElement[]): void;
    static getSlotChildren(slots: Slots): SlotElement[];
}
