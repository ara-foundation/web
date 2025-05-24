import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink, ModuleLink as PackageLink } from "./links/index.js";
import { RestDispatcher } from "./rest.js";
/**
 * Any SDS Service will have a meta information such as it's unique ID.
 */
export interface SDSMetaInterface {
    packageLink: PackageLink;
}
/**
 * Setup proxies and extensions of the service
 */
export interface SDSSetup<Ext extends SDSExtensionInterface> extends SDSMetaInterface {
    proxies?: SDSProxy[];
    extensionTag?: string;
    extensions?: Ext[];
}
/**
 * Any SDS Proxy must implement the following interface.
 * Not recommended to use on it's own, but instead extend {@link SDSProxy}
 */
export interface SDSProxyInterface extends SDSMetaInterface {
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void;
    publicMethods: string[];
}
/**
 * Any SDS Extension must implement the following interface
 */
export interface SDSExtensionInterface extends SDSMetaInterface {
    restHandler?: RestDispatcher<any>;
}
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
/**
 * Almost a ready to use SDS Proxy
 */
export declare abstract class SDSProxy implements SDSProxyInterface {
    private _packageLink;
    private _proxies?;
    protected _publicMethods: string[];
    protected _hidedMethods: Record<string, any>;
    get publicMethods(): string[];
    constructor(_moduleLink: PackageLink, _publicMethods: string[]);
    get packageLink(): PackageLink;
    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    proxifyMe<ProxyFront>(): Result<ProxyFront>;
    /**
     * Before using {@link proxify}, call this method to know what is the proxy of this proxy.
     * @param proxies
     */
    protected postProxies(proxies: SDSProxy[]): void;
    protected hideByProxy<ProxyInheritance extends SDSProxy>(behindProxy: ProxyInheritance): void;
}
export declare class SDSExtensionOperator<CustomExtension extends SDSExtensionInterface> {
    private _extensions;
    private _extDispatcher;
    private _restDispatcherOperator?;
    constructor(serviceLink: ModuleLink, initialExts: CustomExtension[], extTag?: string);
    set restDispatcherOperator(operator: typeof this._restDispatcherOperator);
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    /**
     * Return all extensions of the SDS Service
     */
    get all(): Readonly<CustomExtension>[];
    get extensionCount(): number;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    add(ext: CustomExtension): Promise<OkResult>;
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    update(ext: CustomExtension): Promise<OkResult>;
    remove(exts: CustomExtension[]): Promise<OkResult>;
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
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    private handleExtensionUpdate;
    private handleExtensionDeletion;
}
/**
 * Independent SDS Service that will have proxies and extensions.
 * Since, SDS Services can be proxified, they also have some elements of proxies.
 *
 * It comes with the Rest forward.
 */
export declare class SDSService<Ext extends SDSExtensionInterface> extends SDSProxy {
    private _extensionOperator;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup: SDSSetup<Ext>, pubMethods: string[]);
    get extensionOperator(): SDSExtensionOperator<Ext>;
}
