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
export interface Extendable extends Meta {}

/**
 * Even though we can use Record<ModuleURL, Extendable> as a type for the extensions,
 * We use the operator to handle the extensions.
 * This is because we can replace it later to use with the restful API.
 */
export interface ExtendableOperator {
    extensions: Readonly<Extendable>[];
    extensionAmount: number;
    addExtension(ext: Extendable): Promise<OkResult>;
    getExtension(moduleURL: ModuleURL): Extendable|undefined;
    updateExtension(ext: Extendable): Promise<OkResult>;
    removeExtension(exts: Extendable[]): Promise<OkResult>;
}

/**********************************************************
 * 
 * Implement the classes with the implementing interfaces
 * 
 *********************************************************/

export class Base implements Meta {
    private readonly _packageLink: ModuleLink;

    constructor(packageLink: ModuleLink) {
        this._packageLink = packageLink;
    }

    public get packageLink(): ModuleLink {
        return this._packageLink;
    }
}

/**
 * Almost a ready to use Proxy
 */
export class Proxy extends Base implements Target {
    private _proxies?: Proxy[];
    public readonly hideableMethods: string[] = [];
    protected hiddenMethods: Record<string, any> = {};

    constructor(packageLink: ModuleLink, hideableMethods: string[]) {
        super(packageLink);
        this.hideableMethods = hideableMethods;
    }

    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    public proxifyMe<ProxyFront>(): Result<ProxyFront> {
        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this as unknown as ProxyFront);
        }

        if (this.hideableMethods?.length > 0) {
            this.hideByProxy(this);
        }

        const proxy = this._proxies.shift()!;

        if ((proxy as Target).putBehindData !== undefined) {
            // Hided methods are shown back if the data is put behind.
            let obj: any = Object.create(this);
            for (let methodName in this.hiddenMethods) {
                obj[methodName] = this.hiddenMethods[methodName].bind(obj);
            }
            (proxy as Target).putBehindData!(obj);
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
        if (Object.keys(behindProxy.hiddenMethods).length > 0 || behindProxy.hideableMethods === undefined) {
            return;
        }
        for(let pubKey of behindProxy.hideableMethods) {
            if ((behindProxy as any)[pubKey] === undefined) {
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} Proxy inheritance`;
            }
            behindProxy.hiddenMethods[pubKey] = (behindProxy as any)[pubKey];
            (behindProxy as any)[pubKey] = undefined;
        }
    }
}

/**
 * This operator handls all Extensions that service has.
 */
export class ExtensionOperator implements ExtendableOperator {
    private _exts: Record<ModuleURL, Extendable> = {};

    constructor(initialExts: Extendable[]) {
        initialExts.forEach(ext => {
            if (this._exts[ext.packageLink.url] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.url}'.`
            }
            this._exts[ext.packageLink.url] = ext;
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
    public get extensions(): Readonly<Extendable>[] {
        return Object.values(this._exts);
    }

    public get extensionAmount(): number {
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
    public async addExtension(ext: Extendable): Promise<OkResult> {
        if (this._exts[ext.packageLink.url] !== undefined) {
            return OkResult.fail(
                `The extension exists already`, 
                `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`
            );
        }
        this._exts[ext.packageLink.url] = ext;
        return OkResult.ok();
    }

    public getExtension(moduleURL: ModuleURL): Extendable|undefined {
        return this._exts[moduleURL];
    }

    /**
     * Update the extension.
     * @param _selector 
     * @param node 
     * @param data 
     * @returns 
     */
    public async updateExtension(ext: Extendable): Promise<OkResult> {
        if (this._exts[ext.packageLink.url] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
 
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`create('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    public async removeExtension(exts: Extendable[]): Promise<OkResult> {
        for (const ext of exts) {
            if (this._exts[ext.packageLink.url] === undefined) {
                return OkResult.fail(`The extension not found`, `Can not delete ${ext.packageLink}.`);
            }

            delete this._exts[ext.packageLink.url];
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
    protected operator: ExtendableOperator;

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: Setup, pubMethods: string[]) {
        super(setup.packageLink, pubMethods);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this.operator = new ExtensionOperator(exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }

    public get extensionOperator(): ExtendableOperator {
        return this.operator;
    }
}
