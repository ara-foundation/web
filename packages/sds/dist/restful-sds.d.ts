import { OkResult } from "@ara-web/p-hintjens";
import type { ModuleLink, ModuleURL } from "./links/module-link.js";
import { Rest, RestDispatcher, RestQueue } from "./rest.js";
import type { Meta, ExtensionOperator, ExtensionOperatorTraits, Setup } from "./sds.js";
export interface RestfulSetup extends Setup {
    tag: string;
}
/**
 * Any Extension must implement the following interface
 */
export interface RestfulExtension extends Meta {
    extensionRestDispatcher?: RestDispatcher;
    extensionRestQueue?: RestQueue;
}
export declare class RestfulExtensionOperator implements ExtensionOperatorTraits {
    private _extensionOperator;
    private _extDispatcher;
    private _restDispatcherOperator?;
    private _restQueue;
    constructor(serviceLink: ModuleLink, extTag: string | undefined, extOp: ExtensionOperator);
    get restDispatcher(): RestDispatcher;
    setRestDispatcherOperator(rest: Rest<any>): Promise<OkResult>;
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    get all(): Readonly<RestfulExtension>[];
    get count(): number;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    create(ext: RestfulExtension): Promise<OkResult>;
    read(moduleURL: ModuleURL): RestfulExtension | undefined;
    update(ext: RestfulExtension): Promise<OkResult>;
    delete(exts: RestfulExtension[]): Promise<OkResult>;
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
