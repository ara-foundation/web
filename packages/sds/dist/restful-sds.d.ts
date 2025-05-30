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
import { RestHandler as RestHandler, type SubRestfulHandler } from "./rest.js";
import type { Meta, ExtensionOperator, ExtendableOperator, Setup } from "./sds.js";
export interface RestfulSetup extends Setup {
    rootNodeTag: string;
}
/**
 * Any Extension must implement the following interface.
 * It adds the sub restful handler to handle extension's handlers
 */
export interface RestfulExtension extends Meta, SubRestfulHandler {
}
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
export declare class RestfulExtensionOperator implements ExtendableOperator {
    private _extensionOperator;
    private _restHandler;
    constructor(serviceLink: ModuleLink, extTag: string | undefined, extOp: ExtensionOperator);
    get restHandler(): RestHandler;
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    get extensions(): Readonly<RestfulExtension>[];
    get extensionAmount(): number;
    addExtension(_: RestfulExtension): Promise<OkResult>;
    getExtension(moduleURL: ModuleURL): RestfulExtension | undefined;
    updateExtension(_: RestfulExtension): Promise<OkResult>;
    removeExtension(_: RestfulExtension[]): Promise<OkResult>;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    private _addExtension;
    private _updateExtension;
    private _removeExtension;
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
    private handleExtensionAddition;
    private handleExtensionUpdate;
    private handleExtensionDeletion;
}
