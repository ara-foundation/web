import { selectOne, selectAll } from "css-select";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { ExtensionOperator, Service } from "./sds.js";
import { ObjectNodeAdapter, ObjectNode } from "./tree.js";
import { LinkTraits } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
/**
 * RestSynchronizer is used to keep track of the object nodes
 * that are pending to be synchronized by the rest.
 */
export class RestSynchronizer {
    pendingKeys = new Set();
    rootNode;
    objectToNodeTree;
    constructor(node, objectToNodeTree) {
        this.pendingKeys = new Set();
        this.rootNode = node;
        this.objectToNodeTree = objectToNodeTree;
    }
}
/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export class RestHandler {
    _operatorLink;
    _tag;
    constructor(operatorLink, tag) {
        this._operatorLink = operatorLink;
        this._tag = tag;
    }
    get packageLink() {
        return this._operatorLink;
    }
    get tag() {
        return this._tag;
    }
    isMatchingTag(selector) {
        return LinkTraits.getTagName(selector)?.toLowerCase() === this._tag.toLowerCase();
    }
    handlePost;
    handlePut;
    handlePatch;
    handleDelete;
}
export class RestDispatcher extends ExtensionOperator {
    get handlers() {
        return this.exts.filter(ext => ext instanceof RestHandler);
    }
    async post(parentOrBigBro, newBornChild, options = { lilBro: false }) {
        for (const handler of this.handlers) {
            if (handler.handlePost === undefined) {
                continue;
            }
            const handled = await handler.handlePost(parentOrBigBro, newBornChild, options);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').posting(): ${handled.errorTitle}`, handled.errorDescription);
            }
        }
        return OkResult.ok();
    }
    async put(selector, node, data) {
        for (const handler of this.handlers) {
            if (handler.handlePut === undefined) {
                continue;
            }
            const handled = await handler.handlePut(selector, node, data);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handlePut(): ${handled.errorTitle}`, handled.errorDescription);
            }
        }
        return OkResult.ok();
    }
    async patch(selector, node, data) {
        for (const handler of this.handlers) {
            if (handler.handlePatch === undefined) {
                continue;
            }
            const handled = await handler.handlePatch(selector, node, data);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handlePatch(): ${handled.errorTitle}`, handled.errorDescription);
            }
        }
        return OkResult.ok();
    }
    async delete(selector, nodes) {
        if (nodes.length === 0) {
            return OkResult.ok();
        }
        for (const handler of this.handlers) {
            if (handler.handleDelete === undefined) {
                continue;
            }
            const handled = await handler.handleDelete(selector, nodes);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handleDelete(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription);
            }
        }
        return OkResult.ok();
    }
}
/**
 * Rest is the Service that creates a CSS Selector traversing for the objects.
 *
 * It starts by accepting the JSON object that could be the root node.
 *
 * The rest extensions are called forwarders and if given, they will forward the written data to the extension.
 *
 * Example to use:
 *
 * ```
 * const rest = new Rest(setup, {slots: page.slots}, pageToTreeNode);
 * const welcomeComponent = await rest.get!("Layout > Welcome")
 * ```
 */
export class Rest extends Service {
    _options;
    _root;
    dataToObjectNode;
    constructor(object, dataToObjectNode, setup = { packageLink: ModuleLink.newPackageLink("@ara-web", "rest") }) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone"]);
        this._options = { adapter: new ObjectNodeAdapter() };
        this._root = dataToObjectNode(object);
        this.dataToObjectNode = dataToObjectNode;
        this.operator = new RestDispatcher(setup.extensions || []);
    }
    get rootNode() {
        return this._root;
    }
    setRootNode(obj) {
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }
    /**
     * Returns the extension operator as the rest dispatcher, since all rest handlers are returned as extensions.
     */
    get dispatcher() {
        return this.operator;
    }
    /******************************************************************
     *
     * RESTFule methods
     *
     *******************************************************************/
    async get(selector) {
        return selectOne(selector, [this._root], this._options);
    }
    async getAll(selector) {
        return selectAll(selector, [this._root], this._options);
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
        let bigBro;
        let parent;
        if (options.lilBro) {
            bigBro = parentOrBigBro.getValue();
            parent = bigBro.parent;
        }
        else {
            parent = parentOrBigBro.getValue();
        }
        let newBornChild = this.dataToObjectNode(data, parent);
        const handled = await this.dispatcher.post(parentOrBigBro.getValue(), newBornChild, options);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.post(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription);
        }
        const posted = this._appendChild(newBornChild, bigBro);
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
        const element = node.data;
        if (element !== null && typeof element !== typeof data) {
            return OkResult.fail(`Element type mismatch`);
        }
        const handled = await this.dispatcher.put(selector, node, data);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.put(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription);
        }
        node.data = data;
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
        const handled = await this.dispatcher.patch(selector, node, data);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.patch(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription);
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
        const handled = await this.dispatcher.delete(selector, nodes);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.delete(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription);
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
        const clone = new Rest(this._root.data, this.dataToObjectNode);
        clone._root = this._root;
        clone.delete(attrSelector);
        return clone;
    }
}
