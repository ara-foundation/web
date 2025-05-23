import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink as PackageLink } from "./links/index.js";
import { DOCUMENT_SELECTOR, LinkTraits } from "./link-traits.js";
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
export class SDSProxy {
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
                throw `The '${pubKey}' not in the ${behindProxy.packageLink.toString()} SDSProxy inheritance`;
            }
            behindProxy._hidedMethods[pubKey] = behindProxy[pubKey];
            behindProxy[pubKey] = undefined;
        }
    }
}
export class SDSExtensionReceiver {
    _extensions;
    _extensionTag;
    packageLink;
    constructor(packageLink, extensionTag, extensions) {
        this.packageLink = packageLink;
        this._extensions = extensions;
        this._extensionTag = extensionTag;
    }
    get extensions() {
        return this._extensions;
    }
    get extensionCount() {
        return this._extensions.length;
    }
    isExtensionTag(selector) {
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
    async forwardPost(parentOrBigBro, node, options) {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extensionTag) {
                return OkResult.ok();
            }
        }
        else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }
        // Now, let's make sure it exists
        if (!this.isExtensionTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extensionTag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.getElement();
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }
        const extIndex = this._extensions.findIndex((ext) => ext.packageLink.isEqual(node.getElement().packageLink));
        if (extIndex > -1) {
            return OkResult.fail(`The extension exists already`, `Can not post duplicate of ${node.getElement().packageLink}. Call rest.put instead.`);
        }
        this._extensions.push(node.getElement());
        return OkResult.ok();
    }
    async forwardPut(selector, node, data) {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this.isExtensionTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extensionTag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.getElement();
        if (ext === null || !("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in data)) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const extIndex = this._extensions.findIndex((ext) => ext.packageLink.isEqual(node.getElement().packageLink));
        if (extIndex === -1) {
            return OkResult.fail(`The extension not found`, `The ${node.getElement().packageLink} not found. Call rest.post instead.`);
        }
        this._extensions[extIndex] = data;
        return OkResult.ok();
    }
    async forwardPatch(selector, node, attrValue) {
        return OkResult.ok();
    }
    async forwardDelete(selector, nodes) {
        for (const node of nodes) {
            if (!this.isExtensionTag(node.selector)) {
                continue;
            }
            const element = node.getElement();
            if (element === null || !("packageLink" in element)) {
                return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the ${node.selector} node to be extension`);
            }
            // Remove the extension from the extensions list
            const preDelete = this._extensions.length;
            this._extensions = this._extensions.filter((ext) => !ext.packageLink.isEqual(element.packageLink));
            if (this._extensions.length - 1 !== preDelete) {
                return OkResult.fail(`The extension not found`, `The ${element.packageLink} not found. Can not delete it.`);
            }
        }
        return OkResult.ok();
    }
}
export class SDSService extends SDSProxy {
    _extensionReceiver;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup, pubMethods) {
        super(setup.packageLink, pubMethods);
        const extTag = setup.extensionTag === undefined ? "memop" : setup.extensionTag;
        const exts = setup.extensions === undefined ? [] : setup.extensions;
        this._extensionReceiver = new SDSExtensionReceiver(setup.packageLink, extTag, exts);
        // In case if it's proxified:
        if (setup.proxies !== undefined && setup.proxies.length > 0) {
            this.postProxies(setup.proxies.reverse());
            this.hideByProxy(this);
        }
    }
}
