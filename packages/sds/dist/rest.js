import { selectOne, selectAll } from "css-select";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { ExtensionOperator, Service } from "./sds.js";
import { ObjectNodeAdapter, ObjectNode } from "./tree.js";
import { LinkTraits } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
// Decorator to use if the method is hided behind the post.
export function RestfulMethod(message) {
    return function (target, key, descriptor) {
        const errorMessage = message || 'Method is hidden by the RESTful API, please call REST operation';
        descriptor.value = function (...args) {
            throw new Error(errorMessage);
        };
        return descriptor;
    };
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
/**
 * RestDispatcher is the extension operator of the SDS service called Rest.
 */
export class RestDispatcher extends ExtensionOperator {
    get handlers() {
        return this.extensions.filter(ext => ext instanceof RestHandler);
    }
    /**
     * Dispatch newly created data, for example to save in the database
     * @param parentNode
     * @param newBornChild
     * @returns
     */
    async post(parentNode, newBornChild) {
        for (const handler of this.handlers) {
            if (handler.handlePost === undefined) {
                continue;
            }
            const handled = await handler.handlePost(parentNode, newBornChild);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').posting(): ${handled.errorTitle}`, handled.errorDescription);
            }
        }
        // Add the sub handler
        const subHandler = newBornChild.data;
        if (subHandler.restHandler !== undefined) {
            const subHandlerAdded = await this.addExtension(subHandler.restHandler);
            if (subHandlerAdded.isFailure) {
                return OkResult.fail(`this.dispatcher.addExtension(subHandler): ${subHandlerAdded.errorTitle}`, subHandlerAdded.errorDescription);
            }
        }
        return OkResult.ok();
    }
    /**
     * Dispatch the data update for example update the database row.
     * @param selector
     * @param node
     * @param data
     * @returns
     */
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
    /**
     * Dispatch the update of the data's property, for example to update the database.
     * @param selector
     * @param node
     * @param data
     * @returns
     */
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
    /**
     * Dispatch the deletion of the data, for example delete the row in the database too.
     * @param selector
     * @param nodes
     * @returns
     */
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
        for (const node of nodes) {
            const subHandler = node.data;
            if (subHandler.restHandler !== undefined) {
                const subHandlerRemoved = await this.removeExtension([subHandler.restHandler]);
                if (subHandlerRemoved.isFailure) {
                    return OkResult.fail(`this.removeExtension(subHandler): ${subHandlerRemoved.errorTitle}`, subHandlerRemoved.errorDescription);
                }
            }
        }
        return OkResult.ok();
    }
}
const restPackgeLink = ModuleLink.newPackageLink("@ara-web", "sds", "rest");
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
    constructor(dataToObjectNode, setup = { packageLink: restPackgeLink }) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete"]);
        this._options = { adapter: new ObjectNodeAdapter() };
        this._root = dataToObjectNode();
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
     * Returns the extension operator as the rest dispatcher,
     * since all writing back in the code is done by the extensions.
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
     * @param parentSelector Parent or a big brother's link if `options.lilBro` is set true.
     * @param childData  Object node's data
     * @param options Set to little bro if you want to set object after the selector.
     * @returns
     */
    async post(parentSelector, childData) {
        const parent = await this.get(parentSelector);
        if (parent === null) {
            return Result.fail(`Rest.get('${parentSelector}'): parent not found`, `Please pass the correct selector`);
        }
        let newBornChild = this.dataToObjectNode(childData, parent);
        const handled = await this.dispatcher.post(parent, newBornChild);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.post(selector: '${parentSelector}'): ${handled.errorTitle}`, handled.errorDescription);
        }
        newBornChild.parent.appendChild(newBornChild);
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
        const attrSetted = node.setAttribute(attrName, data);
        if (attrSetted.isFailure) {
            return OkResult.fail(`Rest.get('${selector}').setAttribute('${attrName}'): ${attrSetted.errorTitle}`, attrSetted.errorDescription);
        }
        const handled = await this.dispatcher.patch(attrSelector, node, data);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.patch(selector: '${attrSelector}'): ${handled.errorTitle}`, handled.errorDescription);
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
}
