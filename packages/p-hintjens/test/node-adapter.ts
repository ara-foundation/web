import { Debug } from "../src";
import { Adapter } from "../src/traits/link-traits";

export class NodeAdapter<BranchedModuleObject extends Node> implements Adapter<Node, BranchedModuleObject>{
    private EMPTY_OBJECT = {};

	public isTag(elem: Node): elem is BranchedModuleObject {
		return elem.nodeType === 1;
	}

    public getChildren(elem: Node): Node[] {
	return elem.childNodes ? Array.prototype.slice.call(elem.childNodes, 0) : [];
    }

    public getParent(elem: BranchedModuleObject): BranchedModuleObject|null {
	    return elem.parentNode as unknown as BranchedModuleObject;
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
                ancestor = this.getParent(ancestor as unknown as BranchedModuleObject)
            }

            // If the node has been found to be unique, re-insert it.
            if(replace) {
                nodes[idx] = node;
            }
        }

        return nodes;
    }

    public existsOne(test, elems){
		return elems.some((elem) => {
			return this.isTag(elem) ?
				test(elem) || this.existsOne(test, this.getChildren(elem)) :
				false;
		});
	}

	public getSiblings (elem){
		var parent = this.getParent(elem);
		return parent ? this.getChildren(parent) : [elem];
	}
	
    public getAttributeValue(elem, name){
		if(elem.attributes && name in elem.attributes){
			var attr = elem.attributes[name];
			return typeof attr === "string" ? attr : attr.value;
		} else if (name === "class" && elem.classList) {
			return Array.from(elem.classList).join(" ");
		}
	}

	public hasAttrib(elem, name){
		return name in (elem.attributes || this.EMPTY_OBJECT);
	}

	public getName(elem){
		return (elem.tagName || "").toLowerCase();
	}

	public findOne(test, arr){
		var elem = null;

		for(var i = 0, l = arr.length; i < l && !elem; i++){
			if(test(arr[i])){
				elem = arr[i];
			} else {
				var childs = this.getChildren(arr[i]);
				if(childs && childs.length > 0){
					elem = this.findOne(test, childs);
				}
			}
		}

		return elem;
	}

	public findAll(test, elems: Node[]): BranchedModuleObject[] {
		Debug.push(`findAll`)
		Debug.log(`Find all predicate: ${test.toString()}`)
		var result: BranchedModuleObject[] = [];
		for(var i = 0, j = elems.length; i < j; i++){
			Debug.log(`\n\n\n`)
			Debug.log(`${i}/${elems.length-1}) name '${test.name}' against elem name '${this.getName(elems[i] as unknown as BranchedModuleObject)}'`)
			Debug.log(`${i}/${elems.length-1}) ${JSON.stringify(test.next, null, 4)}`)
			Debug.log(`${i}/${elems.length-1}) ${JSON.stringify(elems[i].nodeName, null, 4)}`)
			if(!this.isTag(elems[i])) continue;
			if(test(elems[i])) {
				Debug.log(`${i}/${elems.length-1}) passed`)
				result.push(elems[i] as unknown as BranchedModuleObject);
			} else {
				Debug.log(`${i}/${elems.length-1}) not passed`)
			}
			var childs = this.getChildren(elems[i]);
			if(childs) {
				const foundChildren = this.findAll(test, childs);
				Debug.log(`${i}/${elems.length-1}) found children: ${foundChildren.length}`)
				result = result.concat(foundChildren);
			}
		}
		Debug.pop();
		return result;
	}
	
    public getText(elem) {
		if(Array.isArray(elem)) return elem.map(this.getText).join("");

		if(this.isTag(elem)) return this.getText(this.getChildren(elem));

		if(elem.nodeType === 3) return elem.nodeValue;

		return "";
	}
}