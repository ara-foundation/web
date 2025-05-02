import { Result } from "@ara-web/ts-enhancement";
import {} from "./reflect-interface.js";
/**
 * Extension Interface that all module handlers based on.
 */
export class ReflectProxy {
    _description;
    _moduleLink;
    _proxies;
    _publicMethods = [];
    _hidedMethods = {};
    get publicMethods() {
        return this._publicMethods;
    }
    set publicMethods(value) {
        this._publicMethods = value;
    }
    constructor(_desc, _moduleLink) {
        this._description = _desc;
        this._moduleLink = _moduleLink;
    }
    get description() {
        return this._description;
    }
    get moduleLink() {
        return this._moduleLink;
    }
    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    proxifyMe() {
        if (this.publicMethods !== undefined && this.publicMethods.length > 0) {
            this.hideByProxy(this);
        }
        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this);
        }
        const proxy = this._proxies.shift();
        if (proxy === undefined) {
            return Result.ok(this);
        }
        if (proxy.putBehindData !== undefined) {
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
        if (Object.keys(this._hidedMethods).length > 0 || behindProxy.publicMethods === undefined) {
            return;
        }
        for (let pubKey of behindProxy.publicMethods) {
            this._hidedMethods[pubKey] = behindProxy[pubKey];
            behindProxy[pubKey] = undefined;
        }
    }
}
