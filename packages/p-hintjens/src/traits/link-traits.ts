import * as CSSWhat from "css-what";
import { Debug, OkResult } from "../index.js";
import { ObjectTraits } from "./object-traits.js"
import {type Options as CSSOptions, selectAll as cssGetAll, selectOne as cssGet, is as isCssObjectMatchQuery, compile as cssCompile } from "css-select";

export type ObjectToNodeTree<T>=(obj: T, root: boolean) => ObjectNode<T>;

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
    isTag: boolean;    // The component html name or component name.
    getAttribute(attr: string): string | undefined;
    children: ObjectNodeInterface[];
    parent: ObjectNodeInterface | null;
    name: string;
    siblings: ObjectNodeInterface[];
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

export type ElementOp<T> = {
    getChildren(obj?: T): T[];
    getAttribute(obj: T|undefined, attrName: string): string | undefined;
    getName(obj?: T): string;
    setAttribute<AttrValue>(obj: T, attrName: string, attrValue: AttrValue): OkResult
}

/**
 * ObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 * 
 * Using with the `CSSObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export class ObjectNode<ElementType> implements ObjectNodeInterface {
    public isTag: boolean;
    private _element?: ElementType;  // Only component like data
    private _children: ObjectNode<ElementType>[] = [];
    private _parent?: ObjectNodeInterface;
    private elementOp: ElementOp<ElementType>;

    constructor(
        elementOp: ElementOp<ElementType>,
        element?: ElementType, parent?: ObjectNodeInterface) {
        this.elementOp = elementOp;
        this._children = [];
		this._parent = parent;
		if (element === undefined) {
			this.isTag = true;
		} else {
			this._element = element;
			this.isTag = true;
            const children = elementOp.getChildren(element);
            const parentElement: ObjectNode<ElementType> = this;
            const childNodes = children.map((element) => new ObjectNode(this.elementOp, element, parentElement))

            this.setChildren(childNodes);
		}
    }
    baseURI!: string;
    childNodes!: NodeListOf<ChildNode>;
    firstChild!: ChildNode | null;
    isConnected!: boolean;
    lastChild!: ChildNode | null;
    nextSibling!: ChildNode | null;
    nodeName!: string;
    nodeType!: number;
    nodeValue!: string | null;
    ownerDocument!: Document | null;
    parentElement!: HTMLElement | null;
    parentNode!: ParentNode | null;
    previousSibling!: ChildNode | null;
    textContent!: string | null;

    public get selector(): string {
        if (this._element === undefined) {
			return DOCUMENT_SELECTOR;
        }
        let mySelectorId = this.getAttribute("id") || "";
        if (mySelectorId.length > 0) {
            mySelectorId = `#${mySelectorId}`;
        }
        let mySelectorClasses = this.getAttribute("class") || "";
            if (mySelectorClasses.length > 0) {
            mySelectorClasses = mySelectorClasses.split(" ").map(c => (`.${c.trim()}`)).join("")
        }
        const mySelector = `${this.name}${mySelectorClasses}${mySelectorId}`
		return this._parent ? `${this._parent.selector} > ${mySelector}` : mySelector;
    }

    appendChild<T extends Node>(node: T): T {
        this._children.push(node as unknown as ObjectNode<ElementType>);
        (node as unknown as ObjectNode<ElementType>).setParent(this);
		return node;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cloneNode(deep?: boolean): Node {
        return ObjectTraits.deepCopy(this) as Node;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compareDocumentPosition(other: Node): number {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contains(other: Node | null): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRootNode(options?: GetRootNodeOptions): Node {
        throw new Error("Method not implemented.");
    }
    hasChildNodes(): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    insertBefore<T extends Node>(node: T, child: Node | null): T {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isDefaultNamespace(namespace: string | null): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isEqualNode(otherNode: Node | null): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSameNode(otherNode: Node | null): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lookupNamespaceURI(prefix: string | null): string | null {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lookupPrefix(namespace: string | null): string | null {
        throw new Error("Method not implemented.");
    }
    normalize(): void {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeChild<T extends Node>(child: T): T {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceChild<T extends Node>(node: Node, child: T): T {
        throw new Error("Method not implemented.");
    }
    ELEMENT_NODE!: 1;
    ATTRIBUTE_NODE!: 2;
    TEXT_NODE!: 3;
    CDATA_SECTION_NODE!: 4;
    ENTITY_REFERENCE_NODE!: 5;
    ENTITY_NODE!: 6;
    PROCESSING_INSTRUCTION_NODE!: 7;
    COMMENT_NODE!: 8;
    DOCUMENT_NODE!: 9;
    DOCUMENT_TYPE_NODE!: 10;
    DOCUMENT_FRAGMENT_NODE!: 11;
    NOTATION_NODE!: 12;
    DOCUMENT_POSITION_DISCONNECTED!: 1;
    DOCUMENT_POSITION_PRECEDING!: 2;
    DOCUMENT_POSITION_FOLLOWING!: 4;
    DOCUMENT_POSITION_CONTAINS!: 8;
    DOCUMENT_POSITION_CONTAINED_BY!: 16;
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC!: 32;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatchEvent(event: Event): boolean {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        throw new Error("Method not implemented.");
    }

    isEqualTo(node: ObjectNodeInterface | null | undefined): boolean {
        if (!node) {
            return false;
        }

        return this === node;
    }

    /**
     * For Pages, it returns empty string.
     */
    public get name(): string {
        return this.elementOp.getName(this._element);
    }
    
    public get parent(): ObjectNodeInterface | null {
		return this._parent === undefined ? null : this._parent;
	}

    getAttribute(attrName: string): string | undefined {
        return this.elementOp.getAttribute(this._element, attrName);
    }
      
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult {
        if (this._element === undefined) {
            return OkResult.fail(`No internal element`, `Are you sure it can set an attribute?`)
        }
        return this.elementOp.setAttribute<AttributeValue>(this._element, name, value);
    }

    public get children(): ObjectNodeInterface[] {
        return this._children;
    }
    public get siblings(): ObjectNodeInterface[] {
		return this.parent === null ? [this] : this.parent.children;
	}
    deleteChildren(): void {
        this._children = [];
    }
    toString(): string {
		throw new Error("Method not implemented.");
    }
    isAttributeExist(attrName: string): boolean {
        return this.elementOp.getAttribute(this._element, attrName) !== undefined;
    }

    public setChildren(children: ObjectNodeInterface[]) {
        this._children = children as ObjectNode<ElementType>[];
    }

    public setParent(parent: ObjectNodeInterface) {
        this._parent = parent;
    }
}

export type Predicate<Value> = (v: Value) => boolean;
export const DOCUMENT_SELECTOR = "#document";

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

    public static parseSelector(query: string): CSSWhat.Selector[][] {
        try {
            const what = CSSWhat.parse(query);
            if (what.length === 0) {
                return [];
            } 
            return what;
        } catch {
            return [];
        }
    }

    public static isAttributeSelector(query: string): boolean {
        const parsed = this.parseSelector(query);
        if (parsed.length < 1) {
            return false;
        }
        const lastIndex = parsed[0].length - 1;
        if (lastIndex < 0) {
            return false;
        }
        const lastToken = parsed[0][lastIndex];
        return lastToken.type === "attribute";
    }

    public static getAttributeName(query: string): string|null {
        const parsed = this.parseSelector(query);
        if (parsed.length < 1) {
            return null;
        }
        const lastIndex = parsed[0].length - 1;
        if (lastIndex < 0) {
            return null;
        }
        const lastToken = parsed[0][lastIndex];
        if (lastToken.type !== "attribute") {
            return null;
        }

        return lastToken.name;
    }

    public static trimAttribute(query: string): string {
        if (!this.isAttributeSelector(query)) {
            return query;
        }

        const parsed = this.parseSelector(query);
        const lastToken = parsed[parsed.length - 1];
        const lastIndex = lastToken.length - 1;
        parsed[parsed.length - 1] = [...(lastToken.slice(0, lastIndex))]
        return CSSWhat.stringify(parsed);
    }
}

export class CSSObjectAdapter<ElementType> implements Adapter<ObjectNodeInterface, ObjectNode<ElementType>>{
	public isTag(elem: ObjectNodeInterface): elem is ObjectNode<ElementType> {
		return elem.isTag;
	}

    public getChildren(elem: ObjectNodeInterface): ObjectNodeInterface[] {
		return elem.children ? Array.prototype.slice.call(elem.children, 0) : [];
    }

    public getParent(elem: ObjectNode<ElementType>): ObjectNode<ElementType>|null {
	    return elem.parent as unknown as ObjectNode<ElementType>;
    }

    public removeSubsets(nodes: ObjectNodeInterface[]): ObjectNodeInterface[] {
	    let idx = nodes.length;
        let node: ObjectNodeInterface;
        let ancestor: ObjectNodeInterface | null;
        let replace: boolean;

        // Check if each node (or one of its ancestors) is already contained in the
        // array.
        while(--idx > -1) {
            node = ancestor = nodes[idx];

            // Temporarily remove the node under consideration
            delete nodes[idx];
            replace = true;

            while(ancestor) {
                if(nodes.indexOf(ancestor) > -1) {
                    replace = false;
                    nodes.splice(idx, 1);
                    break;
                }
                ancestor = this.getParent(ancestor as unknown as ObjectNode<ElementType>)
            }

            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }

        return nodes;
    }

    public existsOne(test: Predicate<ObjectNode<ElementType>>, elems: ObjectNodeInterface[]): boolean {
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings(elem: ObjectNodeInterface): ObjectNodeInterface[] {
		const parent = this.getParent(elem as unknown as ObjectNode<ElementType>);
		return parent ? this.getChildren(parent) : [elem];
	}
	
    public getAttributeValue(elem: ObjectNode<ElementType>, name: string): string | undefined {
		const attr = elem.getAttribute(name);
		return attr;
	}

	public hasAttrib(elem: ObjectNode<ElementType>, name: string): boolean {
		return (elem.getAttribute(name) !== undefined);
	}

	public getName(elem: ObjectNode<ElementType>): string {
		return elem.name.toLocaleLowerCase();
	}

	public findOne(
        test: Predicate<ObjectNode<ElementType>>,
        arr: ObjectNodeInterface[]
    ): ObjectNode<ElementType> | null {
		let elem: ObjectNode<ElementType> | null = null;

		for(let i = 0, l = arr.length; i < l && !elem; i++){
			if(test(arr[i] as unknown as ObjectNode<ElementType>)){
				elem = arr[i] as unknown as ObjectNode<ElementType>;
			} else {
				const childs = this.getChildren(arr[i]);
				if(childs && childs.length > 0){
					elem = this.findOne(test, childs);
				}
			}
		}

		return elem;
	}

	public findAll(test: Predicate<ObjectNode<ElementType>>, elems: ObjectNodeInterface[]): ObjectNode<ElementType>[] {
		let result: ObjectNode<ElementType>[] = [];
		for(let i = 0, j = elems.length; i < j; i++){
			if(!this.isTag(elems[i])) continue;
			if(test(elems[i] as unknown as ObjectNode<ElementType>)) {
				result.push(elems[i] as unknown as ObjectNode<ElementType>);
			}
			const childs = this.getChildren(elems[i]);
			if(childs) {
				const foundChildren = this.findAll(test, childs);
				result = result.concat(foundChildren);
			}
		}
		return result;
	}
	
    public getText(elem: ObjectNodeInterface): string {
		if (elem.isTag) {
			return this.getChildren(elem).map(this.getText).join("");

		}
		return elem.nodeValue || "";
	}
}