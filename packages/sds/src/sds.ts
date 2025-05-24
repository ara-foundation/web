import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink, ModuleLink as PackageLink, type ModuleURL } from "./links/index.js";
import { RestDispatcher } from "./rest.js";
import { DOCUMENT_SELECTOR, LinkTraits, type ObjectNode } from "./link-traits.js";

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
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void
    publicMethods: string[];
}

/**
 * Any SDS Extension must implement the following interface
 */
export interface SDSExtensionInterface extends SDSMetaInterface {}

/**********************************************************
 * 
 * Implement the classes with the implementing interfaces
 * 
 *********************************************************/

/**
 * Almost a ready to use SDS Proxy
 */
export abstract class SDSProxy implements SDSProxyInterface {
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

/**
 * The key difference is scope of responsibility and state management:
 * Operator = Does One Thing
 * Manager = Coordinates Many Things
 * 
 * Database operator will do db operations such as adding data, removing data.
 * Database manager will manage entire database layer, such as connection pools.
 */
/**
 * The SDS Service's rest forwarder. 
 * When creating the rest api, pass this forwarder as the rest's extension.
 * 
 * It's supposed to be the project memory's forwarder. But instead, it acts as the extension holder.
 * Redesign it, so that it keeps only project memory. Project memory's forwarder then
 * will forward further to the sub forwarders.
 * 
 * The logic of the rest forwarding and extension manager of the sds services should be different.
 * 
 * When adding the extension, add the extension's forwarder to this forwarder's sub-child.
 * The extension's forwarder handles the module memory operations such as writing the files to the file system
 * as well as to keep track of the module operations.
 * 
 * When adding a module memory, add the code-piece forwarder, as the sub-child of the extension's forwarder.
 * The code piece forwarder writes the specific part of the data and finally invokes and edits the data.
 * 
 * When adding an astro framework module, add the page forwarder as the sub-child of the extension's forwarder.
 * Forwarders as the rest nodes, build as a parallel node tree where each forward has children and a parent.
 */
export class SDSExtensionOperator<CustomExtension extends SDSExtensionInterface> {
    private _extensions: Record<ModuleURL, CustomExtension> = {};
    private _extDispatcher: RestDispatcher<CustomExtension>;

    constructor(serviceLink: ModuleLink, initialExts: CustomExtension[], extTag: string = 'memop') {
        initialExts.forEach(ext => {
            if (this._extensions[ext.packageLink.moduleURL] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.moduleURL}'.`
            }
            this._extensions[ext.packageLink.moduleURL] = ext;
        });
        this._extDispatcher = new RestDispatcher(serviceLink, extTag);
        this._extDispatcher.posting = this.handleExtensionAddition;
        this._extDispatcher.putting = this.handleExtensionUpdate;
        this._extDispatcher.deleting = this.handleExtensionDeletion;
    }

    /*********************************************************************
     * 
     * Operator's public methods
     * 
     *********************************************************************/

    /**
     * Return all extensions of the SDS Service
     */
    public get all(): Readonly<CustomExtension>[] {
        return Object.values(this._extensions);
    }

    public get extensionCount(): number {
        return Object.keys(this._extensions).length;
    }

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    public async add(
        ext: CustomExtension,
    ): Promise<OkResult> {
        if (this._extensions[ext.packageLink.moduleURL] !== undefined) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`);
        }
        
        this._extensions[ext.packageLink.moduleURL] = ext!;
        // TODO: add dispatcher for each module memory to the rest dispatcher.
        // TODO: when creating SDSExtensionOperator, pass the Rest.sdsExtensionOperator, and put object here
        // TODO: add extensionInterface.restDispatcher? and if its exist, add it.

        return OkResult.ok();
    }

    /**
     * Update the extension.
     * @param _selector 
     * @param node 
     * @param data 
     * @returns 
     */
    public async update(
        ext: CustomExtension
    ): Promise<OkResult> {
        if (this._extensions[ext.packageLink.moduleURL] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
 
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        this._extensions[ext.packageLink.moduleURL] = ext;

        return OkResult.ok();
    }

    public async remove(
        exts: CustomExtension[]
    ): Promise<OkResult> {
        for (const ext of exts) {
            if (this._extensions[ext.packageLink.moduleURL] === undefined) {
                return OkResult.fail(`The extension not found`, `Can not delete ${ext.packageLink}.`);
            }
            // TODO: firstly, remove all extension's dispatcher and in recursive, all module dispatchers.
            delete this._extensions[ext.packageLink.moduleURL];
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
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    private async handleExtensionAddition(
        parentOrBigBro: ObjectNode<CustomExtension>,
        node: ObjectNode<CustomExtension>,
        options?: { lilBro?: boolean }
    ): Promise<OkResult> {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extDispatcher.tag) {
                return OkResult.ok();
            }
        } else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }

        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }

        const ext = node.getElement()!
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }

        return await this.add(ext!);
    }

    /**
     * Update the extension.
     * @param _selector 
     * @param node 
     * @param data 
     * @returns 
     */
    private async handleExtensionUpdate(
        _selector: string,
        node: ObjectNode<CustomExtension>,
        data: CustomExtension
    ): Promise<OkResult> {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        
        const ext = node.getElement()!
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in data)) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        if (ext.packageLink.isEqual(data.packageLink)) {
            return OkResult.fail(
                `The data that you are trying to put has incorrect module url`,
                `The extension you are trying to implement has '${ext.packageLink}', while data to put has '${data.packageLink}', please update your data's package link.`
            )
        }

        return await this.update(data);
    }

    private async handleExtensionDeletion(
        _selector: string, nodes: ObjectNode<CustomExtension>[]
    ): Promise<OkResult> {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.getElement())
            .filter(el => el !== null && ("packageLink" in el));
        if (exts.length === 0) {
            return OkResult.ok();
        }
        return await this.remove(exts);
    }
}

/**
 * Independent SDS Service that will have proxies and extensions.
 * Since, SDS Services can be proxified, they also have some elements of proxies.
 * 
 * It comes with the Rest forward.
 */
export class SDSService<Ext extends SDSExtensionInterface> extends SDSProxy {
    private _extensionOperator: SDSExtensionOperator<Ext>;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: SDSSetup<Ext>, pubMethods: string[]) {
        super(setup.packageLink, pubMethods);
        const extTag = setup.extensionTag === undefined ? "memop" : setup.extensionTag;
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._extensionOperator = new SDSExtensionOperator(setup.packageLink, exts, extTag);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }

    public get extensionOperator(): Readonly<SDSExtensionOperator<Ext>> {
        return this._extensionOperator;
    }
}
