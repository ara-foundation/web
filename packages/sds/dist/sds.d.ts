import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink } from "./links/index.js";
import type { RestExtensionInterface } from "./rest.js";
import { type ObjectNode } from "./link-traits.js";
/**
 * Any package will have a unique package link and description.
 */
export interface SDSMetaInterface {
    packageLink: PackageLink;
}
/**
 * Setup proxies and extensions of the package:
 */
export interface SDSSetup<CustomExtension extends SDSExtensionInterface> extends SDSMetaInterface {
    proxies?: SDSProxy[];
    extensionTag?: string;
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
export declare class SDSExtensionReceiver<CustomExtension extends SDSExtensionInterface> implements RestExtensionInterface<CustomExtension> {
    private _extensions;
    private _extensionTag;
    packageLink: PackageLink;
    constructor(packageLink: PackageLink, extensionTag: string, extensions: CustomExtension[]);
    get extensions(): Readonly<CustomExtension[]>;
    get extensionCount(): number;
    private isExtensionTag;
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    forwardPost(parentOrBigBro: ObjectNode<CustomExtension>, node: ObjectNode<CustomExtension>, options?: {
        lilBro: boolean;
    }): Promise<OkResult>;
    forwardPut(_selector: string, node: ObjectNode<CustomExtension>, data: CustomExtension): Promise<OkResult>;
    forwardPatch<AttrType>(_selector: string, _node: ObjectNode<CustomExtension>, _attrValue: AttrType): Promise<OkResult>;
    forwardDelete(_selector: string, nodes: ObjectNode<CustomExtension>[]): Promise<OkResult>;
}
export declare class SDSService<SDSServiceInheritance extends SDSProxy, CustomExtension extends SDSExtensionInterface> extends SDSProxy implements SDSServiceInterface {
    protected _extensionReceiver: SDSExtensionReceiver<CustomExtension>;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup: SDSSetup<CustomExtension>, pubMethods: string[]);
}
