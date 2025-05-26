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
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void
}

/**
 * Any Extension must implement the following interface
 */
export interface Extension extends Meta {}

/**********************************************************
 * 
 * Implement the classes with the implementing interfaces
 * 
 *********************************************************/

/**
 * Almost a ready to use Proxy
 */
export class Proxy {
    private _packageLink: PackageLink;
    private _proxies?: Proxy[];
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

        if ((proxy as ProxyFrontier).putBehindData !== undefined) {
            // Hided methods are shown back if the data is put behind.
            let obj: any = Object.create(this);
            for (let methodName in this._hidedMethods) {
                obj[methodName] = this._hidedMethods[methodName].bind(obj);
            }
            (proxy as ProxyFrontier).putBehindData!(obj);
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
    protected postProxies(proxies: Proxy[]): void {
        this._proxies = proxies;
    }

    protected hideByProxy<ProxyInheritance extends Proxy>(behindProxy: ProxyInheritance): void {
        if (Object.keys(behindProxy._hidedMethods).length > 0 || behindProxy.publicMethods === undefined) {
            return;
        }
        for(let pubKey of behindProxy.publicMethods) {
            if ((behindProxy as any)[pubKey] === undefined) {
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} Proxy inheritance`;
            }
            behindProxy._hidedMethods[pubKey] = (behindProxy as any)[pubKey];
            (behindProxy as any)[pubKey] = undefined;
        }
    }
}

export interface ExtensionOperatorTraits {
    all: Readonly<Extension>[];
    count: number;
    // CRUD ;)
    create(ext: Extension): Promise<OkResult>;
    read(moduleURL: ModuleURL): Extension|undefined;
    update(ext: Extension): Promise<OkResult>;
    delete(exts: Extension[]): Promise<OkResult>;
}

/**
 * This operator handls all Extensions that service has.
 */
export class ExtensionOperator implements ExtensionOperatorTraits {
    private _exts: Record<ModuleURL, Extension> = {};

    constructor(initialExts: Extension[]) {
        initialExts.forEach(ext => {
            if (this._exts[ext.packageLink.moduleURL] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.moduleURL}'.`
            }
            this._exts[ext.packageLink.moduleURL] = ext;
        });
    }

    /*********************************************************************
     * 
     * Operator's public methods
     * 
     *********************************************************************/

    /**
     * Return all extensions of the Service
     */
    public get all(): Readonly<Extension>[] {
        return Object.values(this._exts);
    }

    public get count(): number {
        return Object.keys(this._exts).length;
    }

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    public async create(
        ext: Extension,
    ): Promise<OkResult> {
        if (this._exts[ext.packageLink.moduleURL] !== undefined) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`);
        }
        return OkResult.ok();
    }

    public read(moduleURL: ModuleURL): Extension|undefined {
        return this._exts[moduleURL];
    }

    /**
     * Update the extension.
     * @param _selector 
     * @param node 
     * @param data 
     * @returns 
     */
    public async update(
        ext: Extension
    ): Promise<OkResult> {
        if (this._exts[ext.packageLink.moduleURL] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
 
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.delete([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this.create(ext);
        if (added.isFailure) {
            return OkResult.fail(`create('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    public async delete(
        exts: Extension[]
    ): Promise<OkResult> {
        for (const ext of exts) {
            if (this._exts[ext.packageLink.moduleURL] === undefined) {
                return OkResult.fail(`The extension not found`, `Can not delete ${ext.packageLink}.`);
            }

            delete this._exts[ext.packageLink.moduleURL];
        }
        return OkResult.ok();
    }
}


/**
 * Independent Service that will have proxies and extensions.
 * Since, Services can be proxified, they also have some elements of proxies.
 * 
 * It comes with the Rest forward.
 */
export class Service extends Proxy {
    private _op: ExtensionOperator;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: Setup, pubMethods: string[]) {
        super(setup.packageLink, pubMethods);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._op = new ExtensionOperator(exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }

    public get extensionOperator(): ExtensionOperator {
        return this._op;
    }
}
