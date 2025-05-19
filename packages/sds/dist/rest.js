import { OkResult, Result } from "@ara-web/p-hintjens";
import { selectOne as cssSelectOne, selectAll as cssSelectAll } from "css-select";
import { SDSProxy, SDSService } from "./sds.js";
import { ModuleLink } from "./index.js";
import { CSSObjectAdapter, LinkTraits } from "./link-traits.js";
export class RestBranchProxy extends SDSProxy {
    _behindData;
    _root;
    constructor(root, moduleLink, description) {
        super(moduleLink, ["post", "getAll"], description);
        this._root = root;
    }
    set rootNode(obj) {
        if (this._root === undefined) {
            return;
        }
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }
    get rootNode() {
        return this._root;
    }
    putBehindData(behindData) {
        this._behindData = behindData;
        this._behindData.setRootNode(this._root);
    }
    getAll(selector) {
        return this._behindData.getAll(`${selector}`);
    }
    post(selector, data, options) {
        return this._behindData.post.bind(this._behindData, `${selector}`, data, options)();
    }
}
/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export class Rest extends SDSService {
    _options;
    _root;
    _objectToNodeTree;
    constructor(object, objectToTreeNode, setup = { packageLink: ModuleLink.newPackageURL("", "name") }) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone", "elementToObjectNode"]);
        this._options = { adapter: new CSSObjectAdapter() };
        this._objectToNodeTree = objectToTreeNode;
        this._root = this._objectToNodeTree(object, undefined, true);
    }
    setRootNode(obj) {
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }
    get rootNode() {
        return this._root;
    }
    elementToObjectNode(data, options) {
        let treeNode;
        if (options.root) {
            treeNode = this._objectToNodeTree(data, undefined, true);
        }
        else if (options.parent) {
            treeNode = this._objectToNodeTree(data, options.parent, false);
        }
        else {
            treeNode = this._objectToNodeTree(data, undefined, false);
        }
        return Result.ok(treeNode);
    }
    /**
     * Retreive a resource node.
     * @param selector
     */
    get(selector) {
        return cssSelectOne(selector, [this._root], this._options);
    }
    getAll(selector) {
        return cssSelectAll(selector, [this._root], this._options);
    }
    post(selector, data, options) {
        let treeNode;
        if (this.elementToObjectNode) {
            treeNode = this.elementToObjectNode(data, options);
        }
        else {
            treeNode = this._hidedMethods["elementToObjectNode"](data, options);
        }
        if (treeNode.isFailure) {
            return OkResult.fail(`this.elementToObjectNode(): ${treeNode.errorTitle}`, treeNode.errorDescription);
        }
        const posted = this._post(selector, treeNode.getValue(), options);
        return posted;
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
    _post(selector, data, options = { lilBro: false }) {
        let elder = this.get(selector);
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
        let elder = this.get(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        }
        if (elder.parent === null) {
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
        const clone = new Rest(this._root.getElement(), this._objectToNodeTree);
        clone._root = this._root;
        clone.delete(attrSelector);
        return clone;
    }
}
