import { Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink } from "./links/index.js";
/**
 * Any package will have a unique package link and description.
 */
export interface SDSMetaInterface {
    description?: string;
    packageLink: PackageLink;
}
/**
 * Setup proxies and extensions of the package:
 */
export interface SDSSetup<CustomExtension extends SDSExtensionInterface> extends SDSMetaInterface {
    proxies?: SDSProxy[];
    extensions?: CustomExtension[];
}
export interface SDSServiceInterface extends SDSMetaInterface {
}
export interface SDSProxyInterface extends SDSMetaInterface {
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void;
    publicMethods: string[];
}
export interface SDSExtensionInterface extends SDSMetaInterface {
}
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
export declare abstract class SDSProxy implements SDSMetaInterface, SDSProxyInterface {
    private _description?;
    private _packageLink;
    private _proxies?;
    protected _publicMethods: string[];
    protected _hidedMethods: Record<string, any>;
    get publicMethods(): string[];
    constructor(_moduleLink: PackageLink, _publicMethods: string[], _desc?: string);
    get description(): string;
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
export declare class SDSService<SDSServiceInheritance extends SDSProxy, CustomExtension extends SDSExtensionInterface> extends SDSProxy implements SDSServiceInterface {
    protected _extensions: CustomExtension[];
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup: SDSSetup<CustomExtension>, pubMethods: string[]);
}
