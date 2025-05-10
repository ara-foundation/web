import { type Adapter, type Predicate } from "@ara-web/p-hintjens";

/**
 * The `NodeAdapter` is an adapter for the DOM Node interface.
 * Interact with the DOM elements using CSS.
 * Combined with the `@ara-web/p-hintjens/rest` package, it can be used to
 * interact with the DOM elements using CSS selectors. 
 */
export class NodeAdapter implements Adapter<Node, HTMLElement>{
    private EMPTY_OBJECT = {};

	public isTag(elem: Node): elem is HTMLElement {
		return elem.nodeType === 1;
	}

    public getChildren(elem: Node): Node[] {
	return elem.childNodes ? Array.prototype.slice.call(elem.childNodes, 0) : [];
    }

    public getParent(elem: HTMLElement): HTMLElement|null {
	    return elem.parentNode as unknown as HTMLElement;
    }

    public removeSubsets(nodes: Node[]): Node[] {
	    let idx = nodes.length;
        let node: Node;
        let ancestor: Node | null;
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
                ancestor = this.getParent(ancestor as unknown as HTMLElement)
            }

            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }

        return nodes;
    }

    public existsOne(test: Predicate<HTMLElement>, elems: Node[]): boolean {
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings (elem: Node): Node[] {
		const parent = this.getParent(elem as unknown as HTMLElement);
		return parent ? this.getChildren(parent) : [elem];
	}
	
    public getAttributeValue(elem: HTMLElement, name: string): string | undefined {
		if (elem.hasAttribute && elem.hasAttribute(name)) {
			const attr = elem.getAttribute(name);
			return attr !== null ? attr : undefined;
		} else if (name === "class" && elem.classList) {
			return Array.from(elem.classList).join(" ");
		}
	}

	public hasAttrib(elem: HTMLElement, name: string): boolean {
		return name in (elem.attributes || this.EMPTY_OBJECT);
	}

	public getName(elem: HTMLElement): string {
		return (elem.tagName || "").toLowerCase();
	}

	public findOne(
        test: Predicate<HTMLElement>,
        arr: Node[]
    ): HTMLElement | null {
		let elem: HTMLElement | null = null;

		for(let i = 0, l = arr.length; i < l && !elem; i++){
			if(test(arr[i] as unknown as HTMLElement)){
				elem = arr[i] as unknown as HTMLElement;
			} else {
				const childs = this.getChildren(arr[i]);
				if(childs && childs.length > 0){
					elem = this.findOne(test, childs);
				}
			}
		}

		return elem;
	}

	public findAll(test: Predicate<HTMLElement>, elems: Node[]): HTMLElement[] {
		let result: HTMLElement[] = [];
		for(let i = 0, j = elems.length; i < j; i++){
			if(!this.isTag(elems[i])) continue;
			if(test(elems[i] as unknown as HTMLElement)) {
				result.push(elems[i] as unknown as HTMLElement);
			}
			const childs = this.getChildren(elems[i]);
			if(childs) {
				const foundChildren = this.findAll(test, childs);
				result = result.concat(foundChildren);
			}
		}
		return result;
	}
	
    public getText(elem: Node): string {
		if(this.isTag(elem)) return this.getChildren(elem).map(this.getText).join("");

		if(elem.nodeType === 3) return elem.nodeValue || "";

		return "";
	}
}