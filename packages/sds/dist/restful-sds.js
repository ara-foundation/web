var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @module restful-sds
 *
 * This module provides the `RestfulExtensionOperator` class and related interfaces
 * to enable runtime management of SDS (Service Discovery System) extensions via a RESTful API.
 *
 * It replaces `ExtensionOperator` public methods with Restful
 * interface, to dynamically
 * add, update, or remove extensions through RESTful operations, and ensures that any custom
 * REST handlers provided by extensions are also registered and managed accordingly.
 */
import { OkResult } from "@ara-web/p-hintjens";
import { ModuleLink } from "./links/module-link.js";
import { RestHandler as RestHandler, RestfulMethod } from "./rest.js";
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
    _restHandler;
    // To register the extension's own restful data if extension has custom handler.
    // private _restDispatcherOperator?: RestDispatcher<any>; 
    constructor(serviceLink, extTag = 'memop', extOp) {
        if (!serviceLink.isPkgURL) {
            throw `Only package url is allowed as the service link`;
        }
        this._extensionOperator = extOp;
        const restDispatcherLink = ModuleLink.fromModuleURL(serviceLink.url, { class: `RestfulExtensionOperator`, tag: extTag }).getValue();
        this._restHandler = new RestHandler(restDispatcherLink, extTag);
        this._restHandler.handlePost = this.handleExtensionAddition.bind(this);
        this._restHandler.handlePut = this.handleExtensionUpdate.bind(this);
        this._restHandler.handleDelete = this.handleExtensionDeletion.bind(this);
    }
    get restHandler() {
        return this._restHandler;
    }
    // public setRestDispatcherOperator(rest: Restful<any>): OkResult {
    //     const documentElement = rest.rootNode!;
    //     if (documentElement === undefined) {
    //         return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
    //     }
    //     if (documentElement.selector !== DOCUMENT_SELECTOR) {
    //         return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
    //     }
    //     this._restDispatcherOperator = rest.dispatcher;
    //     return OkResult.ok();
    // }
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    get extensions() {
        return this._extensionOperator.extensions;
    }
    get extensionAmount() {
        return this._extensionOperator.extensionAmount;
    }
    async addExtension(_) { return OkResult.ok(); }
    getExtension(moduleURL) {
        return this._extensionOperator.getExtension(moduleURL);
    }
    async updateExtension(_) { return OkResult.ok(); }
    async removeExtension(_) { return OkResult.ok(); }
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    async _addExtension(ext) {
        // if (this._restDispatcherOperator === undefined) {
        //     return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        // }
        const added = await this._extensionOperator.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`super.add(): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async _updateExtension(ext) {
        const removed = await this._removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
        }
        const added = await this._addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async _removeExtension(exts) {
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
     * @param parent
     * @param node
     * @param options
     * @returns
     */
    async handleExtensionAddition(parent, node) {
        // Filter out the posts
        if (parent.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an extension`);
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
        const added = await this._addExtension(ext);
        return added;
    }
    async handleExtensionUpdate(_selector, node, data) {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an extension`);
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
        return await this._updateExtension(data);
    }
    async handleExtensionDeletion(_selector, nodes) {
        const exts = nodes
            .filter(node => this._restHandler.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null)
            .map(el => el)
            .filter(el => el.packageLink !== undefined);
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this._removeExtension(exts);
        return removed;
    }
}
__decorate([
    RestfulMethod("Call rest.post('*')")
], RestfulExtensionOperator.prototype, "addExtension", null);
__decorate([
    RestfulMethod("Call rest.put('*')")
], RestfulExtensionOperator.prototype, "updateExtension", null);
__decorate([
    RestfulMethod("Call rest.delete('*')")
], RestfulExtensionOperator.prototype, "removeExtension", null);
