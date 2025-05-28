import { OkResult } from "@ara-web/p-hintjens";
import { ModuleLink, type ModuleURL } from "./links/module-link.js";
import { RestHandler as RestHandler, RestSynchronizer, type Restful } from "./rest.js";
import type { Meta, ExtensionOperator, ExtendableOperator, Setup } from "./sds.js";
export interface RestfulSetup extends Setup {
    rootNodeTag: string;
}
/**
 * Any Extension must implement the following interface
 */
export interface RestfulExtension extends Meta {
    restHandler?: RestHandler;
    extensionRestQueue?: RestSynchronizer;
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
    private _extDispatcher;
    private _restDispatcherOperator?;
    private _restSynchronizer?;
    constructor(serviceLink: ModuleLink, extTag: string | undefined, extOp: ExtensionOperator);
    get restDispatcher(): RestHandler;
    setRestDispatcherOperator(rest: Restful<any>): Promise<OkResult>;
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    get exts(): Readonly<RestfulExtension>[];
    get extensionAmount(): number;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    addExtension(ext: RestfulExtension): Promise<OkResult>;
    getExtension(moduleURL: ModuleURL): RestfulExtension | undefined;
    updateExtension(ext: RestfulExtension): Promise<OkResult>;
    removeExtension(exts: RestfulExtension[]): Promise<OkResult>;
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
    private handleExtensionAddition;
    private handleExtensionUpdate;
    private handleExtensionDeletion;
}
