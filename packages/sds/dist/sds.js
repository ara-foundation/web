import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink } from "./links/index.js";
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
export class Base {
    _packageLink;
    constructor(packageLink) {
        this._packageLink = packageLink;
    }
    get packageLink() {
        return this._packageLink;
    }
}
/**
 * Almost a ready to use Proxy
 */
export class Proxy extends Base {
    _proxies;
    hideableMethods = [];
    hiddenMethods = {};
    constructor(packageLink, hideableMethods) {
        super(packageLink);
        this.hideableMethods = hideableMethods;
    }
    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    proxifyMe() {
        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this);
        }
        if (this.hideableMethods?.length > 0) {
            this.hideByProxy(this);
        }
        const proxy = this._proxies.shift();
        if (proxy.putBehindData !== undefined) {
            // Hided methods are shown back if the data is put behind.
            let obj = Object.create(this);
            for (let methodName in this.hiddenMethods) {
                obj[methodName] = this.hiddenMethods[methodName].bind(obj);
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
        if (Object.keys(behindProxy.hiddenMethods).length > 0 || behindProxy.hideableMethods === undefined) {
            return;
        }
        for (let pubKey of behindProxy.hideableMethods) {
            if (behindProxy[pubKey] === undefined) {
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} Proxy inheritance`;
            }
            behindProxy.hiddenMethods[pubKey] = behindProxy[pubKey];
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
    get exts() {
        return Object.values(this._exts);
    }
    get extensionAmount() {
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
    async addExtension(ext) {
        if (this._exts[ext.packageLink.url] !== undefined) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${ext.packageLink}. Call rest.put instead.`);
        }
        this._exts[ext.packageLink.url] = ext;
        return OkResult.ok();
    }
    getExtension(moduleURL) {
        return this._exts[moduleURL];
    }
    /**
     * Update the extension.
     * @param _selector
     * @param node
     * @param data
     * @returns
     */
    async updateExtension(ext) {
        if (this._exts[ext.packageLink.url] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
        }
        const added = await this.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`create('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async removeExtension(exts) {
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
    operator;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup, pubMethods) {
        super(setup.packageLink, pubMethods);
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this.operator = new ExtensionOperator(exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }
    get extensionOperator() {
        return this.operator;
    }
}
