import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink, type ModuleURL } from "./links/index.js";
/**
 * Any Service will have a meta information such as it's unique ID.
 */
export interface Meta {
    packageLink: PackageLink;
}
/**
 * Setup proxies and extensions of the service
 */
export interface Setup extends Meta {
    proxies?: Proxy[];
    extensions?: Extension[];
}
/**
 * Any Proxy must implement the following interface.
 * Not recommended to use on it's own, but instead extend {@link Proxy}
 */
export interface ProxyFrontier extends Meta {
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void;
}
/**
 * Any Extension must implement the following interface
 */
export interface Extension extends Meta {
}
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
/**
 * Almost a ready to use Proxy
 */
export declare class Proxy {
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
    protected postProxies(proxies: Proxy[]): void;
    protected hideByProxy<ProxyInheritance extends Proxy>(behindProxy: ProxyInheritance): void;
}
export interface ExtensionOperatorTraits {
    all: Readonly<Extension>[];
    count: number;
    create(ext: Extension): Promise<OkResult>;
    read(moduleURL: ModuleURL): Extension | undefined;
    update(ext: Extension): Promise<OkResult>;
    delete(exts: Extension[]): Promise<OkResult>;
}
/**
 * This operator handls all Extensions that service has.
 */
export declare class ExtensionOperator implements ExtensionOperatorTraits {
    private _exts;
    constructor(initialExts: Extension[]);
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    /**
     * Return all extensions of the Service
     */
    get all(): Readonly<Extension>[];
    get count(): number;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    create(ext: Extension): Promise<OkResult>;
    read(moduleURL: ModuleURL): Extension | undefined;
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    update(ext: Extension): Promise<OkResult>;
    delete(exts: Extension[]): Promise<OkResult>;
}
/**
 * Independent Service that will have proxies and extensions.
 * Since, Services can be proxified, they also have some elements of proxies.
 *
 * It comes with the Rest forward.
 */
export declare class Service extends Proxy {
    private _op;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup: Setup, pubMethods: string[]);
    get extensionOperator(): ExtensionOperatorTraits;
}
