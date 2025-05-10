import type { Slots } from "../index.js";
import type { Adapter, ObjectNode, Predicate } from "@ara-web/p-hintjens";
import { PageObjectNode } from "./page-object-node.js";

export const pageToObjectNodes = (slots: Slots): PageObjectNode[] => {
	const doc = new PageObjectNode();
	const children = PageObjectNode.getSlotChildren(slots);
	doc.setChildren(children);
	return [doc];
}

export class PageObjectAdapter implements Adapter<ObjectNode, PageObjectNode>{
	public isTag(elem: ObjectNode): elem is PageObjectNode {
		return elem.isTag;
	}

    public getChildren(elem: ObjectNode): ObjectNode[] {
		return elem.children ? Array.prototype.slice.call(elem.children, 0) : [];
    }

    public getParent(elem: PageObjectNode): PageObjectNode|null {
	    return elem.parent as unknown as PageObjectNode;
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
                ancestor = this.getParent(ancestor as unknown as PageObjectNode)
            }

            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }

        return nodes;
    }

    public existsOne(test: Predicate<PageObjectNode>, elems: ObjectNode[]): boolean {
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings(elem: ObjectNode): ObjectNode[] {
		const parent = this.getParent(elem as unknown as PageObjectNode);
		return parent ? this.getChildren(parent) : [elem];
	}
	
    public getAttributeValue(elem: PageObjectNode, name: string): string | undefined {
		const attr = elem.getAttribute(name);
		return attr;
	}

	public hasAttrib(elem: PageObjectNode, name: string): boolean {
		return (elem.getAttribute(name) !== undefined);
	}

	public getName(elem: PageObjectNode): string {
		return elem.name.toLocaleLowerCase();
	}

	public findOne(
        test: Predicate<PageObjectNode>,
        arr: ObjectNode[]
    ): PageObjectNode | null {
		let elem: PageObjectNode | null = null;

		for(let i = 0, l = arr.length; i < l && !elem; i++){
			if(test(arr[i] as unknown as PageObjectNode)){
				elem = arr[i] as unknown as PageObjectNode;
			} else {
				const childs = this.getChildren(arr[i]);
				if(childs && childs.length > 0){
					elem = this.findOne(test, childs);
				}
			}
		}

		return elem;
	}

	public findAll(test: Predicate<PageObjectNode>, elems: ObjectNode[]): PageObjectNode[] {
		let result: PageObjectNode[] = [];
		for(let i = 0, j = elems.length; i < j; i++){
			if(!this.isTag(elems[i])) continue;
			if(test(elems[i] as unknown as PageObjectNode)) {
				result.push(elems[i] as unknown as PageObjectNode);
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
		if (elem.isTag) {
			return this.getChildren(elem).map(this.getText).join("");

		}
		return elem.nodeValue || "";
	}
}