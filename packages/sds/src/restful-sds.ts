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
import { ModuleLink, type ModuleURL } from "./links/module-link.js";
import { RestHandler as RestHandler, type SubRestfulHandler, RestfulMethod } from "./rest.js";
import type { Meta, ExtensionOperator, ExtendableOperator, Setup, Extendable } from "./sds.js";
import { DOCUMENT_SELECTOR, ObjectNode } from "./tree.js";

export interface RestfulSetup extends Setup {
    rootNodeTag: string,
}

/**
 * Any Extension must implement the following interface.
 * It adds the sub restful handler to handle extension's handlers
 */
export interface RestfulExtension extends Meta, SubRestfulHandler {}

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
export class RestfulExtensionOperator implements ExtendableOperator {
    private _extensionOperator: ExtensionOperator;
    private _restHandler: RestHandler;
    // To register the extension's own restful data if extension has custom handler.
    // private _restDispatcherOperator?: RestDispatcher<any>; 

    constructor(
        serviceLink: ModuleLink, 
        extTag: string = 'memop', 
        extOp: ExtensionOperator
    ) {
        if (!serviceLink.isPkgURL) {
            throw `Only package url is allowed as the service link`
        }
        this._extensionOperator = extOp;
        const restDispatcherLink = ModuleLink.fromModuleURL(serviceLink.url, {class: `RestfulExtensionOperator`, tag: extTag}).getValue();
        this._restHandler = new RestHandler(restDispatcherLink, extTag);
        this._restHandler.handlePost = this.handleExtensionAddition.bind(this);
        this._restHandler.handlePut = this.handleExtensionUpdate.bind(this);
        this._restHandler.handleDelete = this.handleExtensionDeletion.bind(this);
    }

    public get restHandler(): RestHandler {
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

    public get extensions(): Readonly<RestfulExtension>[] {
        return this._extensionOperator.extensions;
    }

    public get extensionAmount(): number {
        return this._extensionOperator.extensionAmount;
    }

    @RestfulMethod("Call rest.post('*')")
    public async addExtension(_: RestfulExtension): Promise<OkResult> {return OkResult.ok()}

    public getExtension(moduleURL: ModuleURL): RestfulExtension|undefined {
        return this._extensionOperator.getExtension(moduleURL);
    }

    @RestfulMethod("Call rest.put('*')")
    public async updateExtension(_: RestfulExtension): Promise<OkResult> {return OkResult.ok()}

    @RestfulMethod("Call rest.delete('*')")
    public async removeExtension(_: RestfulExtension[]): Promise<OkResult> {return OkResult.ok()}

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    private async _addExtension(ext: RestfulExtension): Promise<OkResult> {
        // if (this._restDispatcherOperator === undefined) {
        //     return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        // }

        const added = await this._extensionOperator.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`super.add(): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    private async _updateExtension(ext: RestfulExtension): Promise<OkResult> {
        const removed = await this._removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this._addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    private async _removeExtension(
        exts: RestfulExtension[]
    ): Promise<OkResult> {
        const removed = await this._extensionOperator.removeExtension(exts);
        if (removed.isFailure) {
            return OkResult.fail(`super.delete(): ${removed.errorTitle}`, removed.errorDescription!);
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
    private async handleExtensionAddition<DataType>(
        parent: ObjectNode<DataType>,
        node: ObjectNode<DataType>,
    ): Promise<OkResult> {
        // Filter out the posts
        if (parent.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }

        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an extension`);
        }

        const ext = node.data!;
        if (ext === null) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
         } else if (!("packageLink" in (ext! as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }

        // Explicitly add pending keys, since rest already synchronized.
        // Because this function comes from the rest.

        const added = await this._addExtension(ext! as unknown as RestfulExtension);
        return added;
    }

    private async handleExtensionUpdate<DataType>(
        _selector: string,
        node: ObjectNode<DataType>,
        data: DataType
    ): Promise<OkResult> {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an extension`);
        }
        
        const ext = node.data!
        if (ext === null) {
            return OkResult.fail(`The element is null`, `Please update the node argument`);
        } else if (!("packageLink" in (ext as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in (data as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const dataPkgLink = (data as unknown as RestfulExtension).packageLink;
        const extPkgLink = (ext as unknown as RestfulExtension).packageLink;
        if (extPkgLink.isEqual(dataPkgLink)) {
            return OkResult.fail(
                `The data that you are trying to put has incorrect module url`,
                `The extension you are trying to implement has '${extPkgLink}', while data to put has '${dataPkgLink}', please update your data's package link.`
            )
        }

        return await this._updateExtension(data as unknown as RestfulExtension);
    }

    private async handleExtensionDeletion<DataType>(
        _selector: string, nodes: ObjectNode<DataType>[]
    ): Promise<OkResult> {
        const exts = nodes
            .filter(node => this._restHandler.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null)
            .map(el => el as unknown as Extendable)
            .filter(el => el.packageLink !== undefined);
        
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this._removeExtension(exts);
        return removed;
    }
}