/* eslint-disable @typescript-eslint/no-unused-vars */
import { AstroNode } from "./astro-node.js";
import { ObjectTraits, type Adapter, type ObjectNode, type Predicate } from "@ara-web/p-hintjens";

export class AstroObjectNode implements ObjectNode {
	public selector: string;
	public isTag: boolean;
	private _node?: AstroNode;
	private _children: AstroObjectNode[];
	private _parent?: ObjectNode;
		
	constructor(node?: AstroNode, parent?: ObjectNode) {
		this._children = [];
		this._parent = parent;
		if (node === undefined) {
			this.selector = "";
			this.isTag = true;
		} else {
			this._node = node;
			this.selector = parent ? `${parent.selector} > ${node.name}` : node.name;
			this.isTag = node.isComponent || node.isHTMLElement;

			for (const child of node.children) {
				const childNode = new AstroObjectNode(child, this);
				this._children.push(childNode);
			}
		}
	}

	public get parent(): ObjectNode | null {
		return this._parent === undefined ? null : this._parent;
	}

	public static newPageObjectNode(): AstroObjectNode {
		return new AstroObjectNode();
	}

	getAttribute(attrName: string): string | undefined {
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

	public get children(): ObjectNode[] {
		return this._children
	}

	public get name(): string {
		if (this._node === undefined) {
			return `#document`;
		}
		return this._node.name;
	}

	public get siblings(): ObjectNode[] {
		return this.parent === null ? [this] : this.parent.children;
	}
	deleteChildren(): void {
		this._children = [];
	}
	toString(): string {
		throw new Error("Method not implemented.");
	}
	isAttributeExist(attrName: string): boolean {
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
	isEqualTo(node: ObjectNode | null | undefined): boolean {
		return node?.selector === this.selector;
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
	appendChild<T extends Node>(node: T): T {
		this._children.push(node as unknown as AstroObjectNode);
		return node;
	}
	cloneNode(deep?: boolean): Node {
		return ObjectTraits.deepCopy(this) as Node;
	}
	compareDocumentPosition(other: Node): number {
		throw new Error("Method not implemented.");
	}
	contains(other: Node | null): boolean {
		throw new Error("Method not implemented.");
	}
	getRootNode(options?: GetRootNodeOptions): Node {
		throw new Error("Method not implemented.");
	}
	hasChildNodes(): boolean {
		return this._children.length > 0;
	}
	insertBefore<T extends Node>(node: T, child: Node | null): T {
		throw new Error("Method not implemented.");
	}
	isDefaultNamespace(namespace: string | null): boolean {
		throw new Error("Method not implemented.");
	}
	isEqualNode(otherNode: Node | null): boolean {
		throw new Error("Method not implemented.");
	}
	isSameNode(otherNode: Node | null): boolean {
		throw new Error("Method not implemented.");
	}
	lookupNamespaceURI(prefix: string | null): string | null {
		throw new Error("Method not implemented.");
	}
	lookupPrefix(namespace: string | null): string | null {
		throw new Error("Method not implemented.");
	}
	normalize(): void {
		throw new Error("Method not implemented.");
	}
	removeChild<T extends Node>(child: T): T {
		throw new Error("Method not implemented.");
	}
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
	addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
		throw new Error("Method not implemented.");
	}
	dispatchEvent(event: Event): boolean {
		throw new Error("Method not implemented.");
	}
	removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
		throw new Error("Method not implemented.");
	}
}

export const astroNodesToObjectNodes = (nodes: AstroNode[]): AstroObjectNode[] => {
	const objs: AstroObjectNode[] = []
	const parent = AstroObjectNode.newPageObjectNode();
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const obj = new AstroObjectNode(node, parent);
		objs.push(obj);
		parent.appendChild(obj);
	}
	return objs;
}

export class AstroNodeAdapter<BranchedModuleObject extends ObjectNode> implements Adapter<ObjectNode, BranchedModuleObject>{
    private EMPTY_OBJECT = {};

	public isTag(elem: ObjectNode): elem is BranchedModuleObject {
		return elem.isTag;
	}

    public getChildren(elem: ObjectNode): ObjectNode[] {
		return elem.children ? Array.prototype.slice.call(elem.children, 0) : [];
    }

    public getParent(elem: BranchedModuleObject): BranchedModuleObject|null {
	    return elem.parent as unknown as BranchedModuleObject;
    }

    public removeSubsets(nodes: ObjectNode[]): ObjectNode[] {
	    let idx = nodes.length;
        let node: ObjectNode;
        let ancestor: ObjectNode | null;
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
                ancestor = this.getParent(ancestor as unknown as BranchedModuleObject)
            }

            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }

        return nodes;
    }

    public existsOne(test: Predicate<BranchedModuleObject>, elems: ObjectNode[]): boolean {
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings (elem: ObjectNode): ObjectNode[] {
		const parent = this.getParent(elem as unknown as BranchedModuleObject);
		return parent ? this.getChildren(parent) : [elem];
	}
	
    public getAttributeValue(elem: BranchedModuleObject, name: string): string | undefined  {
		return elem.getAttribute(name);
	}

	public hasAttrib(elem: BranchedModuleObject, name: string): boolean {
		return elem.getAttribute(name) !== undefined;
	}

	public getName(elem: BranchedModuleObject): string {
		return elem.name.toLocaleLowerCase();
	}

	public findOne(test: Predicate<BranchedModuleObject>,
        arr: ObjectNode[]
    ): BranchedModuleObject | null {
		let elem = null;

		for(let i = 0, l = arr.length; i < l && !elem; i++) {
			if(test(arr[i] as unknown as BranchedModuleObject)) {
				elem = arr[i];
			} else {
				const childs = this.getChildren(arr[i]);
				if(childs && childs.length > 0){
					elem = this.findOne(test, childs);
				}
			}
		}

		return elem as unknown as BranchedModuleObject;
	}

	public findAll(test: Predicate<BranchedModuleObject>, elems: ObjectNode[]): BranchedModuleObject[] {
		let result: BranchedModuleObject[] = [];
		for(let i = 0, j = elems.length; i < j; i++){
			if(!this.isTag(elems[i])) continue;
			if(test(elems[i] as unknown as BranchedModuleObject)) {
				result.push(elems[i] as unknown as BranchedModuleObject);
			}
			const childs = this.getChildren(elems[i]);
			if(childs) {
				const foundChildren = this.findAll(test, childs);
				result = result.concat(foundChildren);
			}
		}
		return result;
	}
	
    public getText(elem: ObjectNode): string {
		if(this.isTag(elem)) return this.getChildren(elem).map(this.getText).join("");

		if(elem.nodeType === 3) return elem.nodeValue || "";

		return "";
	}
}