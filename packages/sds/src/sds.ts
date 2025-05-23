import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink } from "./links/index.js";
import type { RestExtensionInterface } from "./rest.js";
import { DOCUMENT_SELECTOR, LinkTraits, type ObjectNode } from "./link-traits.js";

/**
 * Any package will have a unique package link and description.
 */
export interface SDSMetaInterface {
    packageLink: PackageLink;
}

/**
 * Setup proxies and extensions of the package:
 */
export interface SDSSetup<CustomExtension extends SDSExtensionInterface> extends SDSMetaInterface{
    proxies?: SDSProxy[];
    extensionTag?: string;
    extensions?: CustomExtension[];
}

export interface SDSServiceInterface extends SDSMetaInterface {}

export interface SDSProxyInterface extends SDSMetaInterface{
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void
    publicMethods: string[];
}

export interface SDSExtensionInterface extends SDSMetaInterface {}

/**********************************************************
 * 
 * Implement the classes with the implementing interfaces
 * 
 *********************************************************/

export abstract class SDSProxy implements SDSMetaInterface, SDSProxyInterface {
    private _packageLink: PackageLink;
    private _proxies?: SDSProxy[];
    protected _publicMethods: string[] = [];
    protected _hidedMethods: Record<string, any> = {};

    public get publicMethods(): string[] {
        return this._publicMethods;
    }

    constructor(_moduleLink: PackageLink, _publicMethods: string[]) {
        this._packageLink = _moduleLink;
        this._publicMethods = _publicMethods;
    }

    public get packageLink(): PackageLink {
        return this._packageLink;
    }

    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    public proxifyMe<ProxyFront>(): Result<ProxyFront> {
        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this as unknown as ProxyFront);
        }

        if (this.publicMethods !== undefined && this.publicMethods.length > 0) {
            this.hideByProxy(this);
        }

        const proxy = this._proxies.shift()!;

        if ((proxy as SDSProxyInterface).putBehindData !== undefined) {
            // Hided methods are shown back if the data is put behind.
            let obj: any = Object.create(this);
            for (let methodName in this._hidedMethods) {
                obj[methodName] = this._hidedMethods[methodName].bind(obj);
            }
            (proxy as SDSProxyInterface).putBehindData!(obj);
        }
        proxy.postProxies(this._proxies);

        const proxified = proxy.proxifyMe<ProxyFront>();
        if (proxified.isFailure) {
            return Result.fail(`proxy.proxifyMe(): ${proxified.errorTitle}`, proxified.errorDescription!)
        }

        return Result.ok(proxified.getValue());
    }

    /**
     * Before using {@link proxify}, call this method to know what is the proxy of this proxy.
     * @param proxies 
     */
    protected postProxies(proxies: SDSProxy[]): void {
        this._proxies = proxies;
    }

    protected hideByProxy<ProxyInheritance extends SDSProxy>(behindProxy: ProxyInheritance): void {
        if (Object.keys(behindProxy._hidedMethods).length > 0 || behindProxy.publicMethods === undefined) {
            return;
        }
        for(let pubKey of behindProxy.publicMethods) {
            if ((behindProxy as any)[pubKey] === undefined) {
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} SDSProxy inheritance`;
            }
            behindProxy._hidedMethods[pubKey] = (behindProxy as any)[pubKey];
            (behindProxy as any)[pubKey] = undefined;
        }
    }
}

export class SDSExtensionReceiver<CustomExtension extends SDSExtensionInterface> implements RestExtensionInterface<CustomExtension> {
    private _extensions: CustomExtension[];
    private _extensionTag: string;
    packageLink: PackageLink;

    constructor(packageLink: PackageLink, extensionTag: string, extensions: CustomExtension[]) {
        this.packageLink = packageLink;
        this._extensions = extensions;
        this._extensionTag = extensionTag;
    }

    public get extensions(): Readonly<CustomExtension[]> {
        return this._extensions;
    }

    public get extensionCount(): number {
        return this._extensions.length;
    }

    private isExtensionTag(selector: string): boolean {
        return LinkTraits.getTagName(selector)?.toLowerCase() === this._extensionTag.toLowerCase();
    }

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    async forwardPost(
        parentOrBigBro: ObjectNode<CustomExtension>,
        node: ObjectNode<CustomExtension>,
        options?: { lilBro: boolean }
    ): Promise<OkResult> {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extensionTag) {
                return OkResult.ok();
            }
        } else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }

        // Now, let's make sure it exists
        if (!this.isExtensionTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extensionTag}`, `The ${node.selector} expected to be an extension`);
        }

        const ext = node.getElement()!
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }

        const extIndex = this._extensions.findIndex((ext) => ext.packageLink.isEqual(node.getElement()!.packageLink))
        if (extIndex > -1) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${node.getElement()!.packageLink}. Call rest.put instead.`);
        }
        
        this._extensions.push(node.getElement()!);

        return OkResult.ok();
    }

    async forwardPut(
        selector: string,
        node: ObjectNode<CustomExtension>,
        data: CustomExtension
    ): Promise<OkResult> {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this.isExtensionTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extensionTag}`, `The ${node.selector} expected to be an extension`);
        }
        
        const ext = node.getElement()!
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in data)) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }

        const extIndex = this._extensions.findIndex((ext) => ext.packageLink.isEqual(node.getElement()!.packageLink))
        if (extIndex === -1) {
            return OkResult.fail(`The extension not found`, `The ${node.getElement()!.packageLink} not found. Call rest.post instead.`);
        }

        this._extensions[extIndex] = data;

        return OkResult.ok();
    }

    async forwardPatch<AttrType>(
        selector: string,
        node: ObjectNode<CustomExtension>,
        attrValue: AttrType,
    ): Promise<OkResult> {
        return OkResult.ok();
    }

    async forwardDelete(
        selector: string, nodes: ObjectNode<CustomExtension>[]
    ): Promise<OkResult> {
        for (const node of nodes) {
            if (!this.isExtensionTag(node.selector)) {
                continue;
            }

            const element = node.getElement()!
            if (element === null || !("packageLink" in element)) {
                return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the ${node.selector} node to be extension`);
            }

            // Remove the extension from the extensions list
            const preDelete = this._extensions.length;
            this._extensions = this._extensions.filter((ext) => !ext.packageLink.isEqual(element.packageLink))
            if (this._extensions.length - 1 !== preDelete) {
                return OkResult.fail(`The extension not found`, `The ${element.packageLink} not found. Can not delete it.`);
            }
        }
        return OkResult.ok();
    }
}

export class SDSService<SDSServiceInheritance extends SDSProxy, CustomExtension extends SDSExtensionInterface> extends SDSProxy implements SDSServiceInterface  {    
    protected _extensionReceiver: SDSExtensionReceiver<CustomExtension>;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: SDSSetup<CustomExtension>, pubMethods: string[]) {
        super(setup.packageLink, pubMethods);
        const extTag = setup.extensionTag === undefined ? "memop" : setup.extensionTag;
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._extensionReceiver = new SDSExtensionReceiver(setup.packageLink, extTag, exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy<SDSServiceInheritance>(this as unknown as SDSServiceInheritance);
        }
    }
}
