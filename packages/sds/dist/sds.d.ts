import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink, type ModuleURL } from "./links/index.js";
/**********************************************************
 *
 * Interfaces
 *
 *********************************************************/
/**
 * Any Service will have a meta information such as it's unique ID.
 */
export interface Meta {
    packageLink: ModuleLink;
}
/**
 * Setup proxies and extensions of the service
 */
export interface Setup extends Meta {
    proxies?: Proxy[];
    extensions?: Extendable[];
}
/**
 * Any Proxy must implement the following interface.
 * Not recommended to use on it's own, but instead extend {@link Proxy}
 */
export interface Target extends Meta {
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void;
    proxifyMe<ProxyFront>(): Result<ProxyFront>;
}
/**
 * Any Extension must implement the following interface
 */
export interface Extendable extends Meta {
}
/**
 * Even though we can use Record<ModuleURL, Extendable> as a type for the extensions,
 * We use the operator to handle the extensions.
 * This is because we can replace it later to use with the restful API.
 */
export interface ExtendableOperator {
    extensions: Readonly<Extendable>[];
    extensionAmount: number;
    addExtension(ext: Extendable): Promise<OkResult>;
    getExtension(moduleURL: ModuleURL): Extendable | undefined;
    updateExtension(ext: Extendable): Promise<OkResult>;
    removeExtension(exts: Extendable[]): Promise<OkResult>;
}
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
export declare class Base implements Meta {
    private readonly _packageLink;
    constructor(packageLink: ModuleLink);
    get packageLink(): ModuleLink;
}
/**
 * Almost a ready to use Proxy
 */
export declare class Proxy extends Base implements Target {
    private _proxies?;
    readonly hideableMethods: string[];
    protected hiddenMethods: Record<string, any>;
    constructor(packageLink: ModuleLink, hideableMethods: string[]);
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
/**
 * This operator handls all Extensions that service has.
 */
export declare class ExtensionOperator implements ExtendableOperator {
    private _exts;
    constructor(initialExts: Extendable[]);
    /*********************************************************************
     *
     * Operator's public methods
     *
     *********************************************************************/
    /**
     * Return all extensions of the Service
     */
    get extensions(): Readonly<Extendable>[];
    get extensionAmount(): number;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    addExtension(ext: Extendable): Promise<OkResult>;
    getExtension(moduleURL: ModuleURL): Extendable | undefined;
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    updateExtension(ext: Extendable): Promise<OkResult>;
    removeExtension(exts: Extendable[]): Promise<OkResult>;
}
/**
 * Independent Service that will have proxies and extensions.
 * Since, Services can be proxified, they also have some elements of proxies.
 *
 * It comes with the Rest forward.
 */
export declare class Service extends Proxy {
    protected operator: ExtendableOperator;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup: Setup, pubMethods: string[]);
    get extensionOperator(): ExtendableOperator;
}
