import { selectOne as cssSelectOne, selectAll as cssSelectAll } from "css-select";
import { Debug, OkResult, Result } from "@ara-web/p-hintjens";
import { Service } from "./sds.js";
import { ObjectNodeAdapter, ObjectNode } from "./tree.js";
import { LinkTraits } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
/**
 * Rest converts the json into a node tree.
 * But rest is planned to be used in all application.
 * So, it allows adding any data.
 *
 * Additionally, Rest also has the dispatcher.
 * If dispatcher is given, then rest will forward any operation to that dispatcher.
 *
 * Additionally, Rest also has the syncer.
 * If queue is given, then, rest before any request will ask queue,
 * does it have any data to execute. If so, it will execute them before any operation.
 *
 * Any module, that has to synchronize must have it's node inside. And if given data,
 * it must synchronize the rest with it.
 *
 * for example:
 * in reflect:
 * exts = new NodeJSextension().
 * exts[0].node = rest.get!('#${ext.packageLink.moduleURL}');
 * exts[0].putModules()
 *      node !== undefined, and if module !== this.synchronizer.isExist()?
 *          node.appendChild(nodeModules);
 *          node.set();
 *
 * Rest Queue:
 * Calls the rest queue.
 */
export class RestQueue {
    _queue;
    _parentNode;
    _objectToNodeTree;
    constructor(parentNode, objectToNodeTree) {
        this._queue = {};
        this._parentNode = parentNode;
        this._objectToNodeTree = objectToNodeTree;
    }
    get parentNode() {
        return this._parentNode;
    }
    get objectToNodeTree() {
        return this._objectToNodeTree;
    }
    setAll(node, objectToNodeTree) {
        if (this._parentNode !== undefined)
            throw `Parent node was set already`;
        this._parentNode = node;
        this._objectToNodeTree = objectToNodeTree;
    }
    isExist(key) {
        if (this._parentNode === undefined)
            throw `Please set the parent node.`;
        return this._queue[key];
    }
    set(key) {
        if (this._parentNode === undefined)
            throw `Please set the parent node.`;
        this._queue[key] = true;
    }
    unset(key) {
        if (this._parentNode === undefined)
            throw `Please set the parent node.`;
        delete this._queue[key];
    }
}
/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export class RestDispatcher {
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
    posting;
    putting;
    patching;
    deleting;
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
    _objectToNodeTree;
    constructor(object, objectToTreeNode, setup = { packageLink: ModuleLink.newPackageLink("@ara-web", "rest") }) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone", "elementToObjectNode"]);
        this._options = { adapter: new ObjectNodeAdapter() };
        this._objectToNodeTree = objectToTreeNode;
        this._root = this._objectToNodeTree(object, undefined, true);
    }
    get rootNode() {
        return this._root;
    }
    setRootNode(obj) {
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }
    get objectToNodeTree() {
        return this._objectToNodeTree;
    }
    get dispatchers() {
        if (this.extensionOperator.count === 0) {
            return [];
        }
        return this.extensionOperator.all;
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
        Debug.log(`posting the data in the rest`);
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
        Debug.log(`Rest dispatcher pass the element to the extensions `);
        for (const restDispatcher of this.extensionOperator.all) {
            if (restDispatcher.posting !== undefined) {
                Debug.push(`rest dispatcher of ${restDispatcher.packageLink}`);
                const afterPosted = await restDispatcher.posting(parentOrBigBro.getValue(), newBornChild.getValue(), options);
                Debug.pop();
                if (afterPosted.isFailure) {
                    return OkResult.fail(`extension('${restDispatcher.packageLink}').forwardPost(parent: '${selector}'): ${afterPosted.errorTitle}`, afterPosted.errorDescription);
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
        const element = node.data;
        if (element !== null && typeof element !== typeof data) {
            return OkResult.fail(`Element type mismatch`);
        }
        for (const ext of this.dispatchers) {
            if (ext.putting !== undefined) {
                const afterPosted = await ext.putting(selector, node, data);
                if (afterPosted.isFailure) {
                    return OkResult.fail(`extension('${ext.packageLink}').forwardPut(parent: '${selector}'): ${afterPosted.errorTitle}`, afterPosted.errorDescription);
                }
            }
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
        for (const ext of this.dispatchers) {
            if (ext.patching !== undefined) {
                const forwarded = await ext.patching(selector, node, data);
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
        for (const ext of this.dispatchers) {
            if (ext.deleting !== undefined) {
                const forwarded = await ext.deleting(selector, nodes);
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
        const clone = new Rest(this._root.data, this._objectToNodeTree);
        clone._root = this._root;
        clone.delete(attrSelector);
        return clone;
    }
}
