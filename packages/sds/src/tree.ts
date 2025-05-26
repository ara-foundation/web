import { OkResult, ObjectTraits } from "@ara-web/p-hintjens";

export type Predicate<Value> = (v: Value) => boolean;
export const DOCUMENT_SELECTOR = "#document";
export type DataToObjectNode<T> = (obj: T, parent?: ObjectNode<T>, root?: boolean) => ObjectNode<T>;

export interface SelectorNode extends Node {
    selector: string;
    isTag: boolean;    // The component html name or component name.
    getAttribute(attr: string): string | undefined;
    children: SelectorNode[];
    parent: SelectorNode | null;
    name: string;
    siblings: SelectorNode[];
    data: unknown | null;
    deleteChildren(): void;
    toString(): string;
    isAttributeExist(name: string): boolean;
    isEqualTo(node: SelectorNode | null | undefined): boolean;
    setChildren(children: SelectorNode[]): void;
    setParent(parent: SelectorNode): void;
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
export class ObjectNode<DataType> implements SelectorNode {
    public isTag: boolean = true;   // legacy, this is needed by CSS-Select package.
    private _data?: DataType;  // Only component like data
    private _children: ObjectNode<DataType>[] = [];
    private _parent?: SelectorNode;
    private _dataTraits: DataOperations<DataType>;

    constructor(
        dataTraits: DataOperations<DataType>,
        dataToObjectNode: DataToObjectNode<DataType>,
        data?: DataType,
        parent?: SelectorNode,
    ) {
        this._dataTraits = dataTraits;
        this._children = [];
		this._parent = parent;
		if (data) {
			this._data = data;
            const children = dataTraits.getChildren(data);
            const parentElement: ObjectNode<DataType> = this;

            // new ObjectNode() lints this object to it's children
            const childNodes = children.map((child) => dataToObjectNode(child, parentElement))
            // lint child to this node.
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
        if (this._data === undefined) {
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
        this._children.push(node as unknown as ObjectNode<DataType>);
        (node as unknown as ObjectNode<DataType>).setParent(this);
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
        this._children = this._children.filter(node => (node._data as unknown as T) !== child);
        return child;
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

    isEqualTo(node: SelectorNode | null | undefined): boolean {
        if (!node) {
            return false;
        }

        return this === node;
    }

    public get data(): DataType|null {
        return this._data === undefined ? null : this._data;
    }

    public setElement(data: DataType): void {
        this._data = data;
    }

    /**
     * For Pages, it returns empty string.
     */
    public get name(): string {
        return this._dataTraits.getName(this._data);
    }
    
    public get parent(): SelectorNode | null {
		return this._parent === undefined ? null : this._parent;
	}

    getAttribute(attrName: string): string | undefined {
        return this._dataTraits.getAttribute(this._data, attrName);
    }
      
    setAttribute<AttributeValue>(name: string, value: AttributeValue): OkResult {
        if (this._data === undefined) {
            return OkResult.fail(`No internal element`, `Are you sure it can set an attribute?`)
        }
        return this._dataTraits.setAttribute<AttributeValue>(this._data, name, value);
    }

    public get children(): SelectorNode[] {
        return this._children;
    }
    public get siblings(): SelectorNode[] {
		return this.parent === null ? [this] : this.parent.children;
	}
    deleteChildren(): void {
        this._children = [];
    }
    toString(): string {
		throw new Error("Method not implemented.");
    }
    isAttributeExist(attrName: string): boolean {
        return this._dataTraits.getAttribute(this._data, attrName) !== undefined;
    }

    public setChildren(children: SelectorNode[]) {
        this._children = children as ObjectNode<DataType>[];
    }

    public setParent(parent: SelectorNode) {
        this._parent = parent;
    }
}


export class ObjectNodeAdapter<ElementType> implements Adapter<SelectorNode, ObjectNode<ElementType>>{
	public isTag(elem: SelectorNode): elem is ObjectNode<ElementType> {
		return elem.isTag;
	}

    public getChildren(elem: SelectorNode): SelectorNode[] {
		return elem.children ? Array.prototype.slice.call(elem.children, 0) : [];
    }

    public getParent(elem: ObjectNode<ElementType>): ObjectNode<ElementType>|null {
	    return elem.parent as unknown as ObjectNode<ElementType>;
    }

    public removeSubsets(nodes: SelectorNode[]): SelectorNode[] {
	    let idx = nodes.length;
        let node: SelectorNode;
        let ancestor: SelectorNode | null;
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

    public existsOne(test: Predicate<ObjectNode<ElementType>>, elems: SelectorNode[]): boolean {
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings(elem: SelectorNode): SelectorNode[] {
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
        arr: SelectorNode[]
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

	public findAll(test: Predicate<ObjectNode<ElementType>>, elems: SelectorNode[]): ObjectNode<ElementType>[] {
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
	
    public getText(elem: SelectorNode): string {
		if (elem.isTag) {
			return this.getChildren(elem).map(this.getText).join("");

		}
		return elem.nodeValue || "";
	}
}