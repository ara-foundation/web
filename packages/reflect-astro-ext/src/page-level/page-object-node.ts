import { ObjectTraits, type ObjectNode } from "@ara-web/p-hintjens";
import type { SlotElement, Slots } from "../index.js";

/**
 * PageObjectNode is a representation of the page object model.
 * It converts the Page slots into a tree structure.
 * The root node is the page itself, and the children are the slots.
 * 
 * Using with the `PageObjectAdapter` and `pageToObjectNodes` function,
 * it can be used to walk through the page using CSS selectors.
 */
export class PageObjectNode implements ObjectNode {
    public selector: string;
    public isTag: boolean;
    private _element?: SlotElement;  // Only component like data
    private _children: PageObjectNode[] = [];
    private _parent?: ObjectNode;

    constructor(node?: SlotElement, parent?: ObjectNode) {
        this._children = [];
		this._parent = parent;
		if (node === undefined) {
			this.selector = "#document";
			this.isTag = true;
		} else {
			this._element = node;
			this.selector = parent ? `${parent.selector} > ${this.getSelector(node)}` : this.getSelector();
			this.isTag = true;
            if ("slots" in node) {
                const children = PageObjectNode.getSlotChildren(node.slots);
                this.setChildren(children);
            }
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

    public static newPageObjectNode(slots: Slots): PageObjectNode {
        const children = PageObjectNode.getSlotChildren(slots);
		const doc = new PageObjectNode();
        doc.setChildren(children);

        return doc;
	}

    appendChild<T extends Node>(node: T): T {
        this._children.push(node as unknown as PageObjectNode);
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

    isEqualTo(node: ObjectNode | null | undefined): boolean {
        if (!node) {
            return false;
        }
        
        // Compare selectors
        if (this.selector !== node.selector) {
            return false;
        }
        
        // Compare names (if available)
        if (this.name !== node.name) {
            return false;
        }
        
        return true;
    }

    private getSelector(element?: SlotElement): string {
        if (element && "link" in element) {
            return element.link.getTag() || "";
        }
        return "";
    }

    /**
     * For Pages, it returns empty string.
     */
    public get name(): string {
        if (this._element === undefined) {
            return "#document";
        }
        let name = "";
        if (this._element && "link" in this._element) {
            name = this._element.link.getTag() || "";
        }
        
        return name;
    }
    
    public get parent(): ObjectNode | null {
		return this._parent === undefined ? null : this._parent;
	}

    getAttribute(attrName: string): string | undefined {
        if (this._element === undefined) {
            return undefined;
        }
        if ("attributes" in this._element) {
            if (attrName in this._element.attributes) {
                const attr = this._element.attributes[attrName].toString();
                return attr;
            }
        }
        return undefined;
    }
    public get children(): ObjectNode[] {
        return this._children;
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
       if (this._element === undefined) {
			return false;
		}
        if ("attributes" in this._element) {
            for (const elAttr in this._element.attributes) {
                if (elAttr === attrName) {
                    return true;
                }
            }
        }
		return false;
    }

    public setChildren(children: SlotElement[]) {
        for (const childIndex in children) {
            const child = new PageObjectNode(children[childIndex], this);
            this._children.push(child);
        }
    }

    public static getSlotChildren(slots: Slots): SlotElement[] {
        return [...Object.values(slots).reduce((acc, curr) => acc.concat(curr), [])]
    }
}