import { OkResult } from "@ara-web/p-hintjens";
export type Predicate<Value> = (v: Value) => boolean;
export declare const DOCUMENT_SELECTOR = "#document";
export type DataToObjectNode<T> = (obj: T, parent?: ObjectNode<T>) => ObjectNode<T>;
export interface CustomSelectorNode extends Node {
    selector: string;
    isTag: boolean;
    getAttribute(attr: string): string | undefined;
    children: CustomSelectorNode[];
    parent: CustomSelectorNode | null;
    name: string;
    siblings: CustomSelectorNode[];
    data: unknown | null;
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(name: string): boolean;
    isEqualTo(node: CustomSelectorNode | null | undefined): boolean;
    setChildren(children: CustomSelectorNode[]): void;
    setParent(parent: CustomSelectorNode): void;
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult;
    appendChild<T extends Node>(node: T): T;
}
/**
 * @link https://github.com/fb55/css-select/blob/1aa44bdd64aaf2ebdfd7f338e2e76bed36521957/src/types.ts#L6-L96
 */
export interface Adapter<ObjectNode, BranchedModuleObject extends ObjectNode> {
    isTag: (node: ObjectNode) => node is BranchedModuleObject;
    existsOne: (test: Predicate<BranchedModuleObject>, elems: ObjectNode[]) => boolean;
    getAttributeValue: (elem: BranchedModuleObject, name: string) => string | undefined;
    getChildren: (node: ObjectNode) => ObjectNode[];
    getName: (elem: BranchedModuleObject) => string;
    getParent: (node: BranchedModuleObject) => BranchedModuleObject | null;
    getSiblings: (node: ObjectNode) => ObjectNode[];
    getText: (node: ObjectNode) => string;
    hasAttrib: (elem: BranchedModuleObject, name: string) => boolean;
    removeSubsets: (nodes: ObjectNode[]) => ObjectNode[];
    findAll: (test: Predicate<BranchedModuleObject>, nodes: ObjectNode[]) => BranchedModuleObject[];
    findOne: (test: Predicate<BranchedModuleObject>, elems: ObjectNode[]) => BranchedModuleObject | null;
    equals?: (a: ObjectNode, b: ObjectNode) => boolean;
    isHovered?: (elem: BranchedModuleObject) => boolean;
    isVisited?: (elem: BranchedModuleObject) => boolean;
    isActive?: (elem: BranchedModuleObject) => boolean;
}
export type DataOperations<T> = {
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
export declare class ObjectNode<DataType> implements CustomSelectorNode {
    isTag: boolean;
    private _data?;
    private _children;
    private _parent?;
    private _dataTraits;
    constructor(dataTraits: DataOperations<DataType>, dataToObjectNode: DataToObjectNode<DataType>, data?: DataType, parent?: CustomSelectorNode);
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
    isEqualTo(node: CustomSelectorNode | null | undefined): boolean;
    get data(): DataType | null;
    set data(data: DataType);
    /**
     * For Pages, it returns empty string.
     */
    get name(): string;
    get parent(): CustomSelectorNode | null;
    getAttribute(attrName: string): string | undefined;
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult;
    get children(): CustomSelectorNode[];
    get siblings(): CustomSelectorNode[];
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(attrName: string): boolean;
    setChildren(children: CustomSelectorNode[]): void;
    setParent(parent: CustomSelectorNode): void;
}
export declare class ObjectNodeAdapter<ElementType> implements Adapter<CustomSelectorNode, ObjectNode<ElementType>> {
    isTag(elem: CustomSelectorNode): elem is ObjectNode<ElementType>;
    getChildren(elem: CustomSelectorNode): CustomSelectorNode[];
    getParent(elem: ObjectNode<ElementType>): ObjectNode<ElementType> | null;
    removeSubsets(nodes: CustomSelectorNode[]): CustomSelectorNode[];
    existsOne(test: Predicate<ObjectNode<ElementType>>, elems: CustomSelectorNode[]): boolean;
    getSiblings(elem: CustomSelectorNode): CustomSelectorNode[];
    getAttributeValue(elem: ObjectNode<ElementType>, name: string): string | undefined;
    hasAttrib(elem: ObjectNode<ElementType>, name: string): boolean;
    getName(elem: ObjectNode<ElementType>): string;
    findOne(test: Predicate<ObjectNode<ElementType>>, arr: CustomSelectorNode[]): ObjectNode<ElementType> | null;
    findAll(test: Predicate<ObjectNode<ElementType>>, elems: CustomSelectorNode[]): ObjectNode<ElementType>[];
    getText(elem: CustomSelectorNode): string;
}
