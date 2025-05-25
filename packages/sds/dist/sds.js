import { Debug, OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleLink, ModuleLink as PackageLink } from "./links/index.js";
import { Rest, RestDispatcher, RestQueue } from "./rest.js";
import { DOCUMENT_SELECTOR, LinkTraits } from "./link-traits.js";
/**********************************************************
 *
 * Implement the classes with the implementing interfaces
 *
 *********************************************************/
/**
 * Almost a ready to use SDS Proxy
 */
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
export class SDSExtensionOperator {
    _extensions = {};
    _extDispatcher;
    // Rest dispatcher. When extension is added,
    // It will register extension's rest handler in the sds service's rest dispatcher.
    _restDispatcherOperator;
    _restQueue;
    constructor(serviceLink, initialExts, extTag = 'memop') {
        initialExts.forEach(ext => {
            if (this._extensions[ext.packageLink.moduleURL] !== undefined) {
                throw `Duplicate initial extension '${ext.packageLink.moduleURL}'.`;
            }
            this._extensions[ext.packageLink.moduleURL] = ext;
        });
        this._restQueue = new RestQueue();
        this._extDispatcher = new RestDispatcher(serviceLink, extTag);
        this._extDispatcher.posting = this.handleExtensionAddition.bind(this);
        this._extDispatcher.putting = this.handleExtensionUpdate.bind(this);
        this._extDispatcher.deleting = this.handleExtensionDeletion.bind(this);
    }
    get restDispatcher() {
        return this._extDispatcher;
    }
    async setRestDispatcherOperator(rest) {
        const documentElement = await rest.get('*');
        if (documentElement === null) {
            return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
        }
        if (documentElement.selector !== DOCUMENT_SELECTOR) {
            return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
        }
        this._restQueue.setAll(documentElement, rest.objectToNodeTree);
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
    get all() {
        return Object.values(this._extensions);
    }
    get extensionCount() {
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
    async add(ext) {
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
                return OkResult.fail(`restDispatcherOperator.add('${ext.extensionRestDispatcher.packageLink}'): ${added.errorTitle}`, added.errorDescription);
            }
        }
        if (!this._restQueue.isExist(ext.packageLink.moduleURL)) {
            // Very important line.
            // If it's given at the end, then when trying
            // to get the parent object node, it will
            // enter into an infinite cycle. get -> beforeAny -> get...
            this._restQueue.set(ext.packageLink.moduleURL);
            const moduleElement = this._restQueue.objectToNodeTree(this._extensions[ext.packageLink.moduleURL], this._restQueue.parentNode);
            this._restQueue.parentNode.appendChild(moduleElement);
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
    async update(ext) {
        if (this._extensions[ext.packageLink.moduleURL] === undefined) {
            return OkResult.fail(`The extension not found`, `Can not over-write ${ext.packageLink}. Call rest.post instead.`);
        }
        // Remove all dispatchers for the extension's modules.
        // Call first the this.delete();
        const removed = await this.remove([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`remove('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
        }
        const added = await this.add(ext);
        if (added.isFailure) {
            return OkResult.fail(`add('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription);
        }
        return OkResult.ok();
    }
    async remove(exts) {
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
                    return OkResult.fail(`restDispatcherOperator.remove('${ext.extensionRestDispatcher.packageLink}'): ${removed.errorTitle}`, removed.errorDescription);
                }
            }
            if (this._restQueue.isExist(ext.packageLink.moduleURL)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restQueue.set(ext.packageLink.moduleURL);
                const moduleElement = this._restQueue.objectToNodeTree(this._extensions[ext.packageLink.moduleURL], this._restQueue.parentNode);
                this._restQueue.parentNode.removeChild(moduleElement);
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
    async handleExtensionAddition(parentOrBigBro, node, options) {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extDispatcher.tag) {
                return OkResult.ok();
            }
        }
        else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.getElement();
        if (ext === null) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }
        else if (!("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }
        this._restQueue.set(ext.packageLink.moduleURL);
        const added = await this.add(ext);
        if (added.isSuccess) {
            const moduleURL = ext.packageLink.moduleURL;
            this._restQueue.set(moduleURL);
        }
        return added;
    }
    async handleExtensionUpdate(_selector, node, data) {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        const ext = node.getElement();
        if (ext === null) {
            return OkResult.fail(`The element is null`, `Please update the node argument`);
        }
        else if (!("packageLink" in ext)) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in data)) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const dataPkgLink = data.packageLink;
        const extPkgLink = ext.packageLink;
        if (extPkgLink.isEqual(dataPkgLink)) {
            return OkResult.fail(`The data that you are trying to put has incorrect module url`, `The extension you are trying to implement has '${extPkgLink}', while data to put has '${dataPkgLink}', please update your data's package link.`);
        }
        return await this.update(data);
    }
    async handleExtensionDeletion(_selector, nodes) {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.getElement())
            .filter(el => el !== null && ("packageLink" in el));
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this.remove(exts);
        if (removed.isSuccess) {
            exts.forEach(ext => this._restQueue.set(ext.packageLink.moduleURL));
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
    _extensionOperator;
    /**
     * Pass the Reflect Setup to support new types of the modules and their parsing
     * @param setup
     */
    constructor(setup, pubMethods) {
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
    get extensionOperator() {
        return this._extensionOperator;
    }
}
