import { ModuleLink as PackageLink, Result } from "@ara-web/p-hintjens";
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
export class SDSProxy {
    _description;
    _packageLink;
    _proxies;
    _publicMethods = [];
    _hidedMethods = {};
    get publicMethods() {
        return this._publicMethods;
    }
    constructor(_moduleLink, _publicMethods, _desc) {
        this._packageLink = _moduleLink;
        this._publicMethods = _publicMethods;
        this._description = _desc;
    }
    get description() {
        return this._description === undefined ? "" : this._description;
    }
    get packageLink() {
        return this._packageLink;
    }
    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    proxifyMe() {
        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this);
        }
        if (this.publicMethods !== undefined && this.publicMethods.length > 0) {
            this.hideByProxy(this);
        }
        const proxy = this._proxies.shift();
        if (proxy.putBehindData !== undefined) {
            // Hided methods are shown back if the data is put behind.
            const obj = { ...this, ...this._hidedMethods };
            proxy.putBehindData(obj);
        }
        proxy.postProxies(this._proxies);
        const proxified = proxy.proxifyMe();
        if (proxified.isFailure) {
            return Result.fail(`proxy.proxifyMe(): ${proxified.errorTitle}`, proxified.errorDescription);
        }
        return Result.ok(proxified.getValue());
    }
    /**
     * Before using {@link proxify}, call this method to know what is the proxy of this proxy.
     * @param proxies
     */
    postProxies(proxies) {
        this._proxies = proxies;
    }
    hideByProxy(behindProxy) {
        if (Object.keys(behindProxy._hidedMethods).length > 0 || behindProxy.publicMethods === undefined) {
            return;
        }
        for (let pubKey of behindProxy.publicMethods) {
            if (behindProxy[pubKey] === undefined) {
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} SDSProxy inheritance`;
            }
            behindProxy._hidedMethods[pubKey] = behindProxy[pubKey];
            behindProxy[pubKey] = undefined;
        }
    }
}
export class SDSService extends SDSProxy {
    _extensions;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup, pubMethods) {
        super(setup.packageLink, pubMethods, setup.description);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._extensions = exts;
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }
}
