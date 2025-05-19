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
export interface SDSSetup<CustomExtension extends SDSExtensionInterface> extends SDSMetaInterface{
    proxies?: SDSProxy[];
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
    private _description?: string;
    private _packageLink: PackageLink;
    private _proxies?: SDSProxy[];
    protected _publicMethods: string[] = [];
    protected _hidedMethods: Record<string, any> = {};

    public get publicMethods(): string[] {
        return this._publicMethods;
    }

    constructor(_moduleLink: PackageLink, _publicMethods: string[], _desc?: string) {
        this._packageLink = _moduleLink;
        this._publicMethods = _publicMethods;
        this._description = _desc;
    }

    public get description(): string {
        return this._description === undefined ? "" : this._description;
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

export class SDSService<SDSServiceInheritance extends SDSProxy, CustomExtension extends SDSExtensionInterface> extends SDSProxy implements SDSServiceInterface  {    
    protected _extensions: CustomExtension[];

    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup 
     */
    constructor(setup: SDSSetup<CustomExtension>, pubMethods: string[]) {
        super(setup.packageLink, pubMethods, setup.description);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._extensions = exts;
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy<SDSServiceInheritance>(this as unknown as SDSServiceInheritance);
        }
    }
}
