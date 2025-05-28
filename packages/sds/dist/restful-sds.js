import { OkResult } from "@ara-web/p-hintjens";
import { ModuleLink } from "./links/module-link.js";
import { RestHandler as RestHandler, RestDispatcher, RestSynchronizer } from "./rest.js";
import { LinkTraits } from "./link-traits.js";
import { DOCUMENT_SELECTOR, ObjectNode } from "./tree.js";
/**
 * Wraps the ExtensionOperator to provide
 * the synchronization with the rest through RestSynchronizer and RestDispatcher.
 *
 * Purpose is to allow an SDS Service to have a RESTful API
 * to manage the extensions in run-time.
 *
 * It uses the RestDispatcher to handle the RESTful setters
 * and RestSynchronizer to synchronize the data with the rest when this object is updated.
 */
export class RestfulExtensionOperator {
    _extensionOperator;
    _extDispatcher;
    // To register the extension's own restful data if extension has custom handler.
    _restDispatcherOperator;
    _restSynchronizer;
    constructor(serviceLink, extTag = 'memop', extOp) {
        if (!serviceLink.isPkgURL) {
            throw `Only package url is allowed as the service link`;
        }
        this._extensionOperator = extOp;
        const restDispatcherLink = ModuleLink.fromModuleURL(serviceLink.url, { class: `SDSRestfulExtensionOperator`, tag: extTag }).getValue();
        this._extDispatcher = new RestHandler(restDispatcherLink, extTag);
        this._extDispatcher.handlePost = this.handleExtensionAddition.bind(this);
        this._extDispatcher.handlePut = this.handleExtensionUpdate.bind(this);
        this._extDispatcher.handleDelete = this.handleExtensionDeletion.bind(this);
    }
    get restDispatcher() {
        return this._extDispatcher;
    }
    async setRestDispatcherOperator(rest) {
        const documentElement = await rest.get('*');
        if (documentElement === null) {
            return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
        }
        if (documentElement.selector !== DOCUMENT_SELECTOR) {
            return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
        }
        this._restSynchronizer = new RestSynchronizer(documentElement, rest.dataToObjectNode);
        this._restDispatcherOperator = rest.dispatcher;
        return OkResult.ok();
    }
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    get exts() {
        return this._extensionOperator.exts;
    }
    get extensionAmount() {
        return this._extensionOperator.extensionAmount;
    }
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    async addExtension(ext) {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        const added = await this._extensionOperator.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`super.add(): ${added.errorTitle}`, added.errorDescription);
        }
        if (ext.restHandler) {
            const added = await this._restDispatcherOperator.addExtension(ext.restHandler);
            if (added.isFailure) {
                return OkResult.fail(`restDispatcherOperator.create('${ext.restHandler.packageLink}'): ${added.errorTitle}`, added.errorDescription);
            }
        }
        if (!this._restSynchronizer.pendingKeys.has(ext.packageLink.url)) {
            // Very important line.
            // If it's given at the end, then when trying
            // to get the parent object node, it will
            // enter into an infinite cycle. get -> beforeAny -> get...
            this._restSynchronizer.pendingKeys.add(ext.packageLink.url);
            const moduleElement = this._restSynchronizer.objectToNodeTree(this.getExtension(ext.packageLink.url), this._restSynchronizer.rootNode);
            this._restSynchronizer.rootNode.appendChild(moduleElement);
        }
        return OkResult.ok();
    }
    getExtension(moduleURL) {
        return this._extensionOperator.getExtension(moduleURL);
    }
    async updateExtension(ext) {
        const removed = await this.removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
        }
        const added = await this.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async removeExtension(exts) {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        for (const ext of exts) {
            // Remove the extension's rest dispatcher from rest
            if (ext.restHandler) {
                const removed = await this._restDispatcherOperator.removeExtension([ext.restHandler]);
                if (removed.isFailure) {
                    return OkResult.fail(`restDispatcherOperator.remove('${ext.restHandler.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
                }
            }
            if (this._restSynchronizer.pendingKeys.has(ext.packageLink.url)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restSynchronizer.pendingKeys.delete(ext.packageLink.url);
                const moduleElement = this._restSynchronizer.objectToNodeTree(this.getExtension(ext.packageLink.url), this._restSynchronizer.rootNode);
                this._restSynchronizer.rootNode.removeChild(moduleElement);
            }
        }
        const removed = await this._extensionOperator.removeExtension(exts);
        if (removed.isFailure) {
            return OkResult.fail(`super.delete(): ${removed.errorTitle}`, removed.errorDescription);
        }
        return OkResult.ok();
    }
    /***************************************************
     *
     * Rest dispatching methods
     *
     ***************************************************/
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    async handleExtensionAddition(parentOrBigBro, node, options) {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extDispatcher.tag) {
                return OkResult.ok();
            }
        }
        else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.data;
        if (ext === null) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }
        else if (!("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }
        // Explicitly add pending keys, since rest already synchronized.
        // Because this function comes from the rest.
        this._restSynchronizer.pendingKeys.add(ext.packageLink.url);
        const added = await this.addExtension(ext);
        if (added.isFailure) {
            const moduleURL = ext.packageLink.url;
            this._restSynchronizer.pendingKeys.delete(moduleURL);
        }
        return added;
    }
    async handleExtensionUpdate(_selector, node, data) {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.data;
        if (ext === null) {
            return OkResult.fail(`The element is null`, `Please update the node argument`);
        }
        else if (!("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in data)) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const dataPkgLink = data.packageLink;
        const extPkgLink = ext.packageLink;
        if (extPkgLink.isEqual(dataPkgLink)) {
            return OkResult.fail(`The data that you are trying to put has incorrect module url`, `The extension you are trying to implement has '${extPkgLink}', while data to put has '${dataPkgLink}', please update your data's package link.`);
        }
        return await this.updateExtension(data);
    }
    async handleExtensionDeletion(_selector, nodes) {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null)
            .map(el => el)
            .filter(el => el.packageLink !== undefined);
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this.removeExtension(exts);
        if (removed.isFailure) {
            exts.forEach(ext => this._restSynchronizer.pendingKeys.add(ext.packageLink.url));
        }
        return removed;
    }
}
