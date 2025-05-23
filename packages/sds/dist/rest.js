import { OkResult, Result } from "@ara-web/p-hintjens";
import { selectOne as cssSelectOne, selectAll as cssSelectAll } from "css-select";
import { SDSProxy, SDSService } from "./sds.js";
import { CSSObjectAdapter, LinkTraits, ObjectNode } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
export class RestBranchProxy extends SDSProxy {
    _behindData;
    _root;
    constructor(root, moduleLink) {
        super(moduleLink, ["post", "getAll"]);
        this._root = root;
    }
    setRootNode(obj) {
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
    async getAll(selector) {
        return await this._behindData.getAll(`${selector}`);
    }
    async post(selector, data, options) {
        return await this._behindData.post.bind(this._behindData, `${selector}`, data, options)();
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
    async get(selector) {
        return cssSelectOne(selector, [this._root], this._options);
    }
    async getAll(selector) {
        return cssSelectAll(selector, [this._root], this._options);
    }
    /**
     * Post creates a new object node as `selector` child.
     * The object node's data is passed by `data` argument.
     *
     * If `options.lilBro` is set, then `data` is set after `selector` in the same parent.
     *
     * Firstly, the method converts the selector into a parent node.
     * Secondly, the method converts the data along with parent node into an object node.
     * Thirdly using {@link _appendChild} appends the object node into a parent.
     *
     * This method doesn't set the children relationship to the parent.
     * Letting know that selector is a parent occurs in the ObjectNode instantiation.
     * @requires Selector to exist, the object must have a parent.
     * @param selector Parent or a big brother's link if `options.lilBro` is set true.
     * @param data  Object node's data
     * @param options Set to little bro if you want to set object after the selector.
     * @returns
     */
    async post(selector, data, options = { lilBro: false }) {
        const parentOrBigBro = await this._getParentOrBigBro(selector, options);
        if (parentOrBigBro.isFailure) {
            return OkResult.fail(`getParent(): ${parentOrBigBro.errorTitle}`, parentOrBigBro.errorDescription);
        }
        const nodeOptions = {};
        let bigBro;
        if (options.lilBro) {
            bigBro = parentOrBigBro.getValue();
            nodeOptions.parent = bigBro.parent;
        }
        else {
            nodeOptions.parent = parentOrBigBro.getValue();
        }
        let newBornChild = this.elementToObjectNode(data, nodeOptions);
        if (newBornChild.isFailure) {
            return OkResult.fail(`this.elementToObjectNode(): ${newBornChild.errorTitle}`, newBornChild.errorDescription);
        }
        if (this._extensions.length > 0) {
            for (const ext of this._extensions) {
                if (ext.forwardPost !== undefined) {
                    const afterPosted = await ext.forwardPost(selector, newBornChild.getValue());
                    if (afterPosted.isFailure) {
                        return OkResult.fail(`extension('${ext.packageLink}').afterPost(parent: '${selector}'): ${afterPosted.errorTitle}`, afterPosted.errorDescription);
                    }
                }
            }
        }
        const posted = this._appendChild(newBornChild.getValue(), bigBro);
        return posted;
    }
    async _getParentOrBigBro(selector, options = { lilBro: false }) {
        let parentOrBigBro = await this.get(selector);
        if (parentOrBigBro === null) {
            return Result.fail(`Rest.get('${selector}'): not found`, `Please pass the correct elder's selector`);
        }
        if (options.lilBro) {
            if (parentOrBigBro.parent === null) {
                return Result.fail(`Rest('${selector}') is me, and I have no parent to post my lil'bro!`, `Add my parent first. How can I add my sibling if its not my parents.`);
            }
        }
        // not calling lil bro, then its the parents decided to make a love.
        return Result.ok(parentOrBigBro);
    }
    /**
     * Append the data as the child of a parent by calling `data.parent.appendChild()`
     * or `data.parent.setChildren()`.
     * @param newBornChild
     * @param bigBro
     */
    _appendChild(newBornChild, bigBro) {
        if (bigBro === undefined) {
            newBornChild.parent.appendChild(newBornChild);
        }
        else {
            const bigBroIndex = newBornChild.parent.children.findIndex(sibling => sibling.isEqualTo(bigBro));
            if (bigBroIndex === -1) {
                return OkResult.fail(`Can not find the big bro`, `Are you sure it works?`);
            }
            const elderBrothers = newBornChild.parent.children.slice(0, bigBroIndex + 1);
            const youngerCousins = newBornChild.parent.children.slice(bigBroIndex + 1);
            const allChildren = [...elderBrothers, newBornChild, ...youngerCousins];
            newBornChild.parent.setChildren(allChildren);
        }
        return OkResult.ok();
    }
    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector
     * @param data
     */
    async put(selector, data) {
        if (LinkTraits.isAttributeSelector(selector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${selector}'): can not put attribute, call patch`, `The selector has the attribute`);
        }
        let node = await this.get(selector);
        if (node === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        }
        if (node.parent === null) {
            return OkResult.fail(`Rest.get('${selector}'): parent not found`, `Please pass the correct object selector`);
        }
        const element = node.getElement();
        if (element !== null && typeof element !== typeof data) {
            return OkResult.fail(`Element type mismatch`);
        }
        for (const ext of this._extensions) {
            if (ext.forwardPut !== undefined) {
                const afterPosted = await ext.forwardPut(selector, node, data);
                if (afterPosted.isFailure) {
                    return OkResult.fail(`extension('${ext.packageLink}').forwardPut(parent: '${selector}'): ${afterPosted.errorTitle}`, afterPosted.errorDescription);
                }
            }
        }
        node.setElement(data);
        return OkResult.ok();
    }
    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector
     * @param data
     */
    async patch(attrSelector, data) {
        if (!LinkTraits.isAttributeSelector(attrSelector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${attrSelector}'): not an attribute`, `pass attribute selector`);
        }
        const attrName = LinkTraits.getAttributeName(attrSelector);
        const selector = LinkTraits.trimAttribute(attrSelector);
        const node = await this.get(selector);
        if (node === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `There is no element with the selector`);
        }
        for (const ext of this._extensions) {
            if (ext.forwardPatch !== undefined) {
                const forwarded = await ext.forwardPatch(selector, node, data);
                if (forwarded.isFailure) {
                    return OkResult.fail(`extension('${ext.packageLink}').forwardPatch(parent: '${selector}'): ${forwarded.errorTitle}`, forwarded.errorDescription);
                }
            }
        }
        const attrSetted = node.setAttribute(attrName, data);
        if (attrSetted.isFailure) {
            return OkResult.fail(`Rest.get('${selector}').setAttribute('${attrName}'): ${attrSetted.errorTitle}`, attrSetted.errorDescription);
        }
        return OkResult.ok();
    }
    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector
     */
    async delete(selector) {
        const nodes = await this.getAll(selector);
        for (const ext of this._extensions) {
            if (ext.forwardDelete !== undefined) {
                const forwarded = await ext.forwardDelete(selector, nodes);
                if (forwarded.isFailure) {
                    return OkResult.fail(`extension('${ext.packageLink}').forwardDelete(parent: '${selector}'): ${forwarded.errorTitle}`, forwarded.errorDescription);
                }
            }
        }
        if (nodes.length === 0) {
            return OkResult.ok();
        }
        for (let node of nodes) {
            if (node.parent === null || node.parent === undefined) {
                continue;
            }
            // If the element has multiple duplicates, we remove only the first element.
            let filtered = false;
            const remainingChildren = node.parent.children.filter((child) => {
                if (filtered) {
                    return true;
                }
                if (child.isEqualTo(node)) {
                    filtered = true;
                    return false;
                }
                return true;
            });
            if (remainingChildren.length !== node.parent.children.length - 1) {
                return OkResult.fail(`Invalid cleared parent`, `Parent must have a one less element`);
            }
            node.parent.setChildren(remainingChildren);
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
