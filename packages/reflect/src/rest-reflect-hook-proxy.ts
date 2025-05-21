import { OkResult } from "@ara-web/p-hintjens";
import { ModuleLink, ObjectNode, Rest, SDSProxy } from "@ara-web/sds";
import { MEMOP_SELECTOR, type ReflectElementType } from "./reflect-object-tree.js";
import type { ExtensionInterface } from "./extension-interface.js";

export class RestReflectHookProxy extends SDSProxy {
    private _rest?: Rest<ReflectElementType>;
    constructor() {
        super(
            ModuleLink.newPackageURL('reflect', 'rest-reflect-hook-proxy'),
            ['get', 'put', 'getAll', 'post', 'patch', 'delete']
        );
    }
    // Add custom methods or overrides here if needed
    putBehindData(behindData: Rest<ReflectElementType>) {
        this._rest = behindData;
    }

    public async getAll?(selector: string): Promise<ObjectNode<ReflectElementType>[]> {
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const data = this._rest!.getAll!(selector);

        // Optionally, you might want to call afterGet for each element, or just once.
        // Here, we call afterGet once with undefined data, similar to get.
        const finalizationResult = await this.afterGet(selector, undefined);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return data;
    }
    
    public async post?(selector: string, data: ReflectElementType, options: {lilBro?: boolean} = {lilBro: false}): Promise<OkResult> {
        const preparationResult = await this.beforePost(selector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = this._rest!.post!(selector, data, options);

        const finalizationResult = await this.afterPost(selector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    public async get?(selector: string): Promise<ObjectNode<ReflectElementType>|null> {
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        
        const data = this._rest!.get!(selector);
     
        const finalizationResult = await this.afterGet(selector, data === null ? undefined : data.getElement()!);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return data;
    }

    public async put?(selector: string, data: ObjectNode<ReflectElementType>): Promise<OkResult> {
        const preparationResult = await this.beforePut(selector, data.getElement()!);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = this._rest!.put!(selector, data);

        const finalizationResult = await this.afterPut(selector, data.getElement()!);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    public async patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> {
        const preparationResult = await this.beforePatch(attrSelector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = this._rest!.patch!<AttrType>(attrSelector, data);

        const finalizationResult = await this.afterPatch(attrSelector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    public async delete?(selector: string): Promise<OkResult> {
        const preparationResult = await this.beforeDelete(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = this._rest!.delete!(selector);

        const finalizationResult = await this.afterDelete(selector);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    // HOOKS
    /**
     * Call extensions
     */
    private beforeGet = async (selector: string): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(selector, this._rest!);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    private afterGet = async (selector: string, data?: ReflectElementType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.afterGet !== undefined) {
                const hooked = await extension.afterGet(selector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    private beforePost = async (selector: string, data: ReflectElementType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.beforePost !== undefined) {
                const hooked = await extension.beforePost(selector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePost(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPost = async (selector: string, data: ReflectElementType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.afterPost !== undefined) {
                const hooked = await extension.afterPost(selector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPost(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforePut = async (selector: string, data: ReflectElementType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.beforePut !== undefined) {
                const hooked = await extension.beforePut(selector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePut(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPut = async (selector: string, data?: ReflectElementType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.afterPut !== undefined) {
                const hooked = await extension.afterPut(selector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPut(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforePatch = async <AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.beforePatch !== undefined) {
                const hooked = await extension.beforePatch(attrSelector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePatch(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPatch = async <AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.afterPatch !== undefined) {
                const hooked = await extension.afterPatch(attrSelector, this._rest!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPatch(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforeDelete = async (selector: string): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.beforeDelete !== undefined) {
                const hooked = await extension.beforeDelete(selector, this._rest!);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeDelete(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterDelete = async (selector: string): Promise<OkResult> => {
        const memOps = this._rest!.getAll!(MEMOP_SELECTOR).map(node => node.getElement() as ExtensionInterface);
        for (const extension of memOps) {
            if (extension.afterDelete !== undefined) {
                const hooked = await extension.afterDelete(selector, this._rest!);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterDelete(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }
}