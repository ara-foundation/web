import { Debug, OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink, ModuleLink as PackageLink, type ModuleURL } from "./links/index.js";
import { Rest, RestDispatcher, RestQueue, type RestInterface } from "./rest.js";
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
export interface SDSSetup extends SDSMetaInterface {
    proxies?: SDSProxy[];
    extensionTag?: string;
    extensions?: SDSExtensionInterface[];
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
export interface SDSExtensionInterface extends SDSMetaInterface {
    extensionRestDispatcher?: RestDispatcher;
}

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

export class SDSExtensionOperator {
    private _extensions: Record<ModuleURL, SDSExtensionInterface> = {};
    private _extDispatcher: RestDispatcher;
    // Rest dispatcher. When extension is added,
    // It will register extension's rest handler in the sds service's rest dispatcher.
    private _restDispatcherOperator?: SDSExtensionOperator; 
    private _restQueue: RestQueue;

    constructor(serviceLink: ModuleLink, initialExts: SDSExtensionInterface[], extTag: string = 'memop') {
        initialExts.forEach(ext => {
            if (this._extensions[ext.packageLink.moduleURL] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.moduleURL}'.`
            }
            this._extensions[ext.packageLink.moduleURL] = ext;
        });
        this._restQueue = new RestQueue();
        this._extDispatcher = new RestDispatcher(serviceLink, extTag);
        this._extDispatcher.posting = this.handleExtensionAddition.bind(this);
        this._extDispatcher.putting = this.handleExtensionUpdate.bind(this);
        this._extDispatcher.deleting = this.handleExtensionDeletion.bind(this);
    }

    public get restDispatcher(): RestDispatcher {
        return this._extDispatcher;
    }

    public async setRestDispatcherOperator(rest: Rest<any>): Promise<OkResult> {
        const documentElement = await rest.get!('*');
        if (documentElement === null) {
            return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
        }
        if (documentElement.selector !== DOCUMENT_SELECTOR) {
            return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
        }
        this._restQueue.setAll(documentElement!, rest.objectToNodeTree);
        this._restDispatcherOperator = rest.extensionOperator;
        return OkResult.ok();
    }

    /*********************************************************************
     * 
     * Operator's public methods
     * 
     *********************************************************************/

    /**
     * Return all extensions of the SDS Service
     */
    public get all(): Readonly<SDSExtensionInterface>[] {
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
        ext: SDSExtensionInterface,
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        if (this._extensions[ext.packageLink.moduleURL] !== undefined) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`);
        }

        this._extensions[ext.packageLink.moduleURL] = ext;
        if (ext.extensionRestDispatcher) {
            const added = await this._restDispatcherOperator.add(ext.extensionRestDispatcher);
            if (added.isFailure) {
                return OkResult.fail(`restDispatcherOperator.add('${ext.extensionRestDispatcher.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
            }
        }

        if (!this._restQueue.isExist(ext.packageLink.moduleURL)) {
            // Very important line.
            // If it's given at the end, then when trying
            // to get the parent object node, it will
            // enter into an infinite cycle. get -> beforeAny -> get...
            this._restQueue.set(ext.packageLink.moduleURL);
            const moduleElement = this._restQueue.objectToNodeTree!(this._extensions[ext.packageLink.moduleURL], this._restQueue.parentNode!);
            this._restQueue.parentNode!.appendChild(moduleElement);
        }

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
        ext: SDSExtensionInterface
    ): Promise<OkResult> {
        if (this._extensions[ext.packageLink.moduleURL] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
 
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.remove([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`remove('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this.add(ext);
        if (added.isFailure) {
            return OkResult.fail(`add('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    public async remove(
        exts: SDSExtensionInterface[]
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        for (const ext of exts) {
            if (this._extensions[ext.packageLink.moduleURL] === undefined) {
                return OkResult.fail(`The extension not found`, `Can not delete ${ext.packageLink}.`);
            }

            // Remove the extension's rest dispatcher from rest
            if (ext.extensionRestDispatcher) {
                const removed = await this._restDispatcherOperator.remove([ext.extensionRestDispatcher]);
                if (removed.isFailure) {
                    return OkResult.fail(`restDispatcherOperator.remove('${ext.extensionRestDispatcher.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
                }
            }

            if (this._restQueue.isExist(ext.packageLink.moduleURL)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restQueue.set(ext.packageLink.moduleURL);
                const moduleElement = this._restQueue.objectToNodeTree!(this._extensions[ext.packageLink.moduleURL], this._restQueue.parentNode!);
                this._restQueue.parentNode!.removeChild(moduleElement);
            }

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
    private async handleExtensionAddition<DataType>(
        parentOrBigBro: ObjectNode<DataType>,
        node: ObjectNode<DataType>,
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

        const ext = node.getElement()!;
        if (ext === null) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
         } else if (!("packageLink" in (ext! as unknown as SDSExtensionInterface))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }

        this._restQueue.set((ext! as unknown as SDSExtensionInterface).packageLink.moduleURL)
        const added = await this.add(ext! as unknown as SDSExtensionInterface);
        if (added.isSuccess) {
            const moduleURL = (ext! as unknown as SDSExtensionInterface).packageLink.moduleURL;
            this._restQueue.set(moduleURL);
        }
        return added;
    }

    private async handleExtensionUpdate<DataType>(
        _selector: string,
        node: ObjectNode<DataType>,
        data: DataType
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
        if (ext === null) {
            return OkResult.fail(`The element is null`, `Please update the node argument`);
        } else if (!("packageLink" in (ext as unknown as SDSExtensionInterface))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in (data as unknown as SDSExtensionInterface))) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const dataPkgLink = (data as unknown as SDSExtensionInterface).packageLink;
        const extPkgLink = (ext as unknown as SDSExtensionInterface).packageLink;
        if (extPkgLink.isEqual(dataPkgLink)) {
            return OkResult.fail(
                `The data that you are trying to put has incorrect module url`,
                `The extension you are trying to implement has '${extPkgLink}', while data to put has '${dataPkgLink}', please update your data's package link.`
            )
        }

        return await this.update(data as unknown as SDSExtensionInterface);
    }

    private async handleExtensionDeletion<DataType>(
        _selector: string, nodes: ObjectNode<DataType>[]
    ): Promise<OkResult> {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.getElement())
            .filter(el => el !== null && ("packageLink" in (el as unknown as SDSExtensionInterface)));
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this.remove(exts as unknown[] as SDSExtensionInterface[]);
        if (removed.isSuccess) {
            exts.forEach(ext => 
                this._restQueue.set((ext as unknown as SDSExtensionInterface).packageLink.moduleURL)
            );
        }
        return removed;
    }
}

/**
 * Independent SDS Service that will have proxies and extensions.
 * Since, SDS Services can be proxified, they also have some elements of proxies.
 * 
 * It comes with the Rest forward.
 */
export class SDSService extends SDSProxy {
    private _extensionOperator: SDSExtensionOperator;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: SDSSetup, pubMethods: string[]) {
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

    public get extensionOperator(): SDSExtensionOperator {
        return this._extensionOperator;
    }
}
