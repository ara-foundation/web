import { Debug, OkResult } from "@ara-web/p-hintjens";
import { ModuleLink, ObjectNode, Rest, RestHandler, Proxy, RestDispatcher } from "@ara-web/sds";
import { MEMOP_SELECTOR } from "./reflect-object-tree.js";
export class RestReflectHookProxy extends Proxy {
    _rest;
    constructor() {
        super(ModuleLink.newPackageLink('@ara-web', 'reflect', 'rest-reflect-hook-proxy'), ['get', 'put', 'getAll', 'post', 'patch', 'delete']);
    }
    get rootNode() {
        return this._rest.rootNode;
    }
    setRootNode(obj) {
        this._rest.setRootNode(obj);
    }
    get handlers() {
        return this._rest.dispatcher.extensions;
    }
    get dispatcher() {
        return this._rest.dispatcher;
    }
    get dataToObjectNode() {
        return this._rest?.dataToObjectNode;
    }
    // Add custom methods or overrides here if needed
    putBehindData(behindData) {
        this._rest = behindData;
    }
    async getAll(selector) {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        const data = await this._rest.getAll(selector);
        // Optionally, you might want to call afterGet for each element, or just once.
        // Here, we call afterGet once with undefined data, similar to get.
        const finalizationResult = await this.afterGet(selector, undefined);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }
        return data;
    }
    async post(selector, data, options = { lilBro: false }) {
        Debug.push(`Before any`);
        const before = await this.beforeAny();
        Debug.pop();
        if (before.isFailure) {
            return OkResult.fail(`beforeAny(): ${before.errorTitle}`, before.errorDescription);
        }
        Debug.push(`Before post`);
        const preparationResult = await this.beforePost(selector, data);
        Debug.pop();
        if (preparationResult.isFailure) {
            return OkResult.fail(`beforePost('${selector}'): ${preparationResult.errorTitle}`, preparationResult.errorDescription);
        }
        const result = await this._rest.post(selector, data);
        if (result.isFailure) {
            return OkResult.fail(`rest.post('${selector}'): ${result.errorTitle}`, result.errorDescription);
        }
        const finalizationResult = await this.afterPost(selector, data);
        if (finalizationResult.isFailure) {
            return OkResult.fail(`afterPost('${selector}'): ${finalizationResult.errorTitle}`, finalizationResult.errorDescription);
        }
        return result;
    }
    async get(selector) {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        const node = await this._rest.get(selector);
        const finalizationResult = await this.afterGet(selector, node === null ? undefined : node.data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }
        return node;
    }
    async put(selector, data) {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforePut(selector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        const result = await this._rest.put(selector, data);
        const finalizationResult = await this.afterPut(selector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }
        return result;
    }
    async patch(attrSelector, data) {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforePatch(attrSelector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        const result = await this._rest.patch(attrSelector, data);
        const finalizationResult = await this.afterPatch(attrSelector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }
        return result;
    }
    async delete(selector) {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeDelete(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        const result = await this._rest.delete(selector);
        const finalizationResult = await this.afterDelete(selector);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }
        return result;
    }
    // HOOKS
    beforeAny = async () => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforeAny !== undefined) {
                const hooked = await extension.beforeAny(this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeAny(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    /**
     * Call extensions
     */
    beforeGet = async (selector) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(selector, this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    afterGet = async (selector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.afterGet !== undefined) {
                const hooked = await extension.afterGet(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterGet(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    beforePost = async (selector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforePost !== undefined) {
                const hooked = await extension.beforePost(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePost(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    afterPost = async (selector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.afterPost !== undefined) {
                const hooked = await extension.afterPost(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPost(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    beforePut = async (selector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforePut !== undefined) {
                const hooked = await extension.beforePut(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePut(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    afterPut = async (selector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.afterPut !== undefined) {
                const hooked = await extension.afterPut(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPut(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    beforePatch = async (attrSelector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforePatch !== undefined) {
                const hooked = await extension.beforePatch(attrSelector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePatch(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    afterPatch = async (attrSelector, data) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.afterPatch !== undefined) {
                const hooked = await extension.afterPatch(attrSelector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPatch(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    beforeDelete = async (selector) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.beforeDelete !== undefined) {
                const hooked = await extension.beforeDelete(selector, this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeDelete(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
    afterDelete = async (selector) => {
        const memOps = (await this._rest.getAll(MEMOP_SELECTOR)).map(node => node.data);
        for (const extension of memOps) {
            if (extension.afterDelete !== undefined) {
                const hooked = await extension.afterDelete(selector, this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterDelete(): ${hooked.errorTitle}`, hooked.errorDescription);
                }
            }
        }
        return OkResult.ok();
    };
}
