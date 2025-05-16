import { selectOne as cssSelectOne, selectAll as cssSelectAll } from "css-select"
import { 
    type SDSExtensionInterface, 
    SDSService, 
    type SDSSetup
} from "./sds.js";
import { OkResult } from "@ara-web/p-hintjens";
import { CSSObjectAdapter, LinkTraits, ObjectNode, type ObjectNodeInterface, type ObjectToNodeTree } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";

export interface RestExtensionInterface extends SDSExtensionInterface {
    // What to pass to the backend.
    // The Astro-Extension's Page for example and page's Post, put, patch, and delete(ObjectLink)
    // We call it setters.

    //
    //
    //
    
}

/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export class Rest<ElementType> extends SDSService<
    Rest<ElementType>, 
    RestExtensionInterface
> {
    
    private _options: {adapter: CSSObjectAdapter<ElementType>};
    private _nodes: ObjectNode<ElementType>[] = [];

    constructor(
        object: ElementType,
        objectToTreeNode: ObjectToNodeTree<ElementType>,
        setup: SDSSetup<RestExtensionInterface> = {packageLink: ModuleLink.newPackageURL("", "name")}
    ) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete"]);
        this._options = {adapter: new CSSObjectAdapter()};
        this._nodes = [objectToTreeNode(object, true)];
    }

    /**
     * Retreive a resource node.
     * @param selector 
     */
    public get?(selector: string): ObjectNode<ElementType>|null {
        return cssSelectOne(selector, this._nodes, this._options);
    }

    public getAll?(selector: string): ObjectNode<ElementType>[] {
        return cssSelectAll(selector, this._nodes, this._options);
    }

    /**
     * Create a new resource. By default the
     * resource is created at the selector.
     * 
     * If `options.lilBro` option put as `True` then
     * it will post the resource next after the `selector`.
     * @param selector 
     * @param data 
     */
    public post?(selector: string, data: ObjectNode<ElementType>, options: {lilBro: boolean} = {lilBro: false}): OkResult {
        const elder = this.get!(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct elder's selector`);
        }
        if (!options.lilBro) {
            data.setParent(elder);
            elder.appendChild(data);
        } else {
            if (elder.parent === null) {
                return OkResult.fail(`Rest('${selector}') parent not found to post lil'bro!`, `Add my parent first.`)
            }

            const happyFamily: ObjectNodeInterface[] = [];
            for (let siblingIndex = 0; siblingIndex < elder.parent.children.length; siblingIndex++) {
                const sibling: ObjectNodeInterface = elder.parent.children[siblingIndex];
                happyFamily.push(sibling);
                if (sibling.isEqualTo(elder)) {
                    happyFamily.push(data);
                    data.setParent(elder.parent);
                }
            }
            elder.parent.setChildren(happyFamily);
        }
        
        return OkResult.ok();
    }

    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector 
     * @param data 
     */
    public put?(selector: string, data: ObjectNode<ElementType>): OkResult {
        const elder = this.get!(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        } else if (elder.parent === null) {
            return OkResult.fail(`Rest.get('${selector}'): parent not found`, `Please pass the correct object selector`);
        }

        const happyFamily: ObjectNodeInterface[] = [];
        for (let siblingIndex = 0; siblingIndex < elder.parent.children.length; siblingIndex++) {
            const sibling: ObjectNodeInterface = elder.parent.children[siblingIndex];
            if (sibling.isEqualTo(elder)) {
                data.setParent(elder.parent);
                happyFamily.push(data);
            } else {
                happyFamily.push(sibling);
            }
        }
        elder.parent.setChildren(happyFamily);
        return OkResult.ok();
    }

    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector 
     * @param data 
     */
    public patch?<AttrType>(attrSelector: string, data: AttrType): OkResult {
        if (!LinkTraits.isAttributeSelector(attrSelector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${attrSelector}'): not an attribute`, `pass attribute selector`);
        }
        const attrName = LinkTraits.getAttributeName(attrSelector);
        const selector = LinkTraits.trimAttribute(attrSelector);
        const elem = this.get!(selector);
        if (elem === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `There is no element with the selector`);
        }
        const attrSetted = elem.setAttribute<AttrType>(attrName!, data);
        if (attrSetted.isFailure) {
            return OkResult.fail(`Rest.get('${selector}').setAttribute('${attrName}'): ${attrSetted.errorTitle}`, attrSetted.errorDescription!);
        }
        return OkResult.ok();
    }

    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector 
     */
    public delete?(selector: string): OkResult {
        const els = this.getAll!(selector);
        if (els.length === 0) {
            return OkResult.ok();
        }
        for (let el of els) {
            if (el.parent === null || el.parent === undefined) {
                continue;
            }
            // If the element has multiple duplicates, we remove only the first element.
            let filtered = false;
            const remainingChildren = el.parent.children.filter((child) => {
                if (filtered) {
                    return true;
                }
                if (child.isEqualTo(el)) {
                    filtered = true;
                    return false;
                }
                return true;
            })
            if (remainingChildren.length !== el.parent.children.length - 1) {
                return OkResult.fail(`Invalid cleared parent`, `Parent must have a one less element`);
            }
            el.parent.setChildren(remainingChildren);
        }
        return OkResult.ok();
    }
}