import { selectOne as cssSelectOne, selectAll as cssSelectAll } from "css-select";
import { SDSService } from "./sds.js";
import { OkResult } from "@ara-web/p-hintjens";
import { CSSObjectAdapter, DOCUMENT_SELECTOR, LinkTraits, ObjectNode } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export class Rest extends SDSService {
    _options;
    _nodes = [];
    _objectToNodeTree;
    constructor(object, objectToTreeNode, setup = { packageLink: ModuleLink.newPackageURL("", "name") }) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone"]);
        this._options = { adapter: new CSSObjectAdapter() };
        this._nodes = [objectToTreeNode(object, true)];
        this._objectToNodeTree = objectToTreeNode;
    }
    /**
     * Retreive a resource node.
     * @param selector
     */
    get(selector) {
        return cssSelectOne(selector, this._nodes, this._options);
    }
    getAll(selector) {
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
    post(selector, data, options = { lilBro: false }) {
        const elder = this.get(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct elder's selector`);
        }
        if (!options.lilBro) {
            data.setParent(elder);
            elder.appendChild(data);
        }
        else {
            if (elder.parent === null) {
                return OkResult.fail(`Rest('${selector}') parent not found to post lil'bro!`, `Add my parent first.`);
            }
            const happyFamily = [];
            for (let siblingIndex = 0; siblingIndex < elder.parent.children.length; siblingIndex++) {
                const sibling = elder.parent.children[siblingIndex];
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
    put(selector, data) {
        const elder = this.get(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        }
        else if (elder.parent === null) {
            return OkResult.fail(`Rest.get('${selector}'): parent not found`, `Please pass the correct object selector`);
        }
        const happyFamily = [];
        for (let siblingIndex = 0; siblingIndex < elder.parent.children.length; siblingIndex++) {
            const sibling = elder.parent.children[siblingIndex];
            if (sibling.isEqualTo(elder)) {
                data.setParent(elder.parent);
                happyFamily.push(data);
            }
            else {
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
    patch(attrSelector, data) {
        if (!LinkTraits.isAttributeSelector(attrSelector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${attrSelector}'): not an attribute`, `pass attribute selector`);
        }
        const attrName = LinkTraits.getAttributeName(attrSelector);
        const selector = LinkTraits.trimAttribute(attrSelector);
        const elem = this.get(selector);
        if (elem === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `There is no element with the selector`);
        }
        const attrSetted = elem.setAttribute(attrName, data);
        if (attrSetted.isFailure) {
            return OkResult.fail(`Rest.get('${selector}').setAttribute('${attrName}'): ${attrSetted.errorTitle}`, attrSetted.errorDescription);
        }
        return OkResult.ok();
    }
    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector
     */
    delete(selector) {
        const els = this.getAll(selector);
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
            });
            if (remainingChildren.length !== el.parent.children.length - 1) {
                return OkResult.fail(`Invalid cleared parent`, `Parent must have a one less element`);
            }
            el.parent.setChildren(remainingChildren);
        }
        return OkResult.ok();
    }
    clone(attrSelector) {
        const clone = new Rest(this._nodes[0].getElement(), this._objectToNodeTree);
        clone._nodes = [...this._nodes];
        clone.delete(attrSelector);
        return clone;
    }
}
