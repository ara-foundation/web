import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink } from "./links/index.js";
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
/**
 * Almost a ready to use Proxy
 */
export class Proxy {
    _packageLink;
    _proxies;
    _publicMethods = [];
    _hidedMethods = {};
    get publicMethods() {
        return this._publicMethods;
    }
    constructor(_moduleLink, _publicMethods) {
        this._packageLink = _moduleLink;
        this._publicMethods = _publicMethods;
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
            let obj = Object.create(this);
            for (let methodName in this._hidedMethods) {
                obj[methodName] = this._hidedMethods[methodName].bind(obj);
            }
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
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} Proxy inheritance`;
            }
            behindProxy._hidedMethods[pubKey] = behindProxy[pubKey];
            behindProxy[pubKey] = undefined;
        }
    }
}
/**
 * This operator handls all Extensions that service has.
 */
export class ExtensionOperator {
    _exts = {};
    constructor(initialExts) {
        initialExts.forEach(ext => {
            if (this._exts[ext.packageLink.url] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.url}'.`;
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
    get all() {
        return Object.values(this._exts);
    }
    get count() {
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
    async create(ext) {
        if (this._exts[ext.packageLink.url] !== undefined) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`);
        }
        return OkResult.ok();
    }
    read(moduleURL) {
        return this._exts[moduleURL];
    }
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    async update(ext) {
        if (this._exts[ext.packageLink.url] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.delete([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
        }
        const added = await this.create(ext);
        if (added.isFailure) {
            return OkResult.fail(`create('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async delete(exts) {
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
    _op;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup, pubMethods) {
        super(setup.packageLink, pubMethods);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._op = new ExtensionOperator(exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }
    get extensionOperator() {
        return this._op;
    }
}
