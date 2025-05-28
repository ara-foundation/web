import { Debug, OkResult } from "@ara-web/p-hintjens";
import { ModuleLink, ObjectNode, Rest, RestHandler, Proxy, type DataToObjectNode, type Restful, RestDispatcher } from "@ara-web/sds";
import { MEMOP_SELECTOR, type ReflectDataType } from "./reflect-object-tree.js";
import type { ModuleManager } from "./module-manager.js";

export class RestReflectHookProxy extends Proxy implements Restful<ReflectDataType> {
    private _rest?: Rest<ReflectDataType>;
    constructor() {
        super(
            ModuleLink.newPackageLink('@ara-web', 'reflect', 'rest-reflect-hook-proxy'),
            ['get', 'put', 'getAll', 'post', 'patch', 'delete']
        );
    }
    public get rootNode(): ObjectNode<ReflectDataType> | undefined {
        return this._rest!.rootNode;
    }

    public setRootNode(obj: ObjectNode<ReflectDataType>): void {
        this._rest!.setRootNode(obj);
    }

    public get dispatchers(): Readonly<RestHandler>[] {
        return this._rest!.dispatcher.exts as unknown as Readonly<RestHandler>[];
    }

    public get dispatcher(): RestDispatcher<ReflectDataType> {
        return this._rest!.dispatcher;
    }

    public get dataToObjectNode(): DataToObjectNode<ReflectDataType> {
        return this._rest?.dataToObjectNode!;
    }

    // Add custom methods or overrides here if needed
    putBehindData(behindData: Rest<ReflectDataType>) {
        this._rest = behindData;
    }

    public async getAll?(selector: string): Promise<ObjectNode<ReflectDataType>[]> {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const data = await this._rest!.getAll!(selector);

        // Optionally, you might want to call afterGet for each element, or just once.
        // Here, we call afterGet once with undefined data, similar to get.
        const finalizationResult = await this.afterGet(selector, undefined);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return data;
    }
    
    public async post?(selector: string, data: ReflectDataType, options: {lilBro?: boolean} = {lilBro: false}): Promise<OkResult> {
        Debug.push(`Before any`)
        const before = await this.beforeAny();
        Debug.pop();
        if (before.isFailure) {
            return OkResult.fail(`beforeAny(): ${before.errorTitle}`, before.errorDescription!);
        }
        Debug.push(`Before post`)
        const preparationResult = await this.beforePost(selector, data);
        Debug.pop();
        if (preparationResult.isFailure) {
            return OkResult.fail(`beforePost('${selector}'): ${preparationResult.errorTitle}`, preparationResult.errorDescription!);
        }

        Debug.push(`rest post`)
        const result = await this._rest!.post!(selector, data, options);
        Debug.pop();
        if (result.isFailure) {
            return OkResult.fail(`rest.post('${selector}'): ${result.errorTitle}`, result.errorDescription!);
        }
        const finalizationResult = await this.afterPost(selector, data);
        if (finalizationResult.isFailure) {
            return OkResult.fail(`afterPost('${selector}'): ${finalizationResult.errorTitle}`, finalizationResult.errorDescription!);
        }

        return result;
    }

    public async get?(selector: string): Promise<ObjectNode<ReflectDataType>|null> {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeGet(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }
        
        const node = await this._rest!.get!(selector);
     
        const finalizationResult = await this.afterGet(selector, node === null ? undefined : node.data!);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return node;
    }

    public async put?(selector: string, data: ReflectDataType): Promise<OkResult> {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforePut(selector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = await this._rest!.put!(selector, data);

        const finalizationResult = await this.afterPut(selector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    public async patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforePatch(attrSelector, data);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = await this._rest!.patch!<AttrType>(attrSelector, data);

        const finalizationResult = await this.afterPatch(attrSelector, data);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    public async delete?(selector: string): Promise<OkResult> {
        const before = await this.beforeAny();
        if (before.isFailure) {
            throw before;
        }
        const preparationResult = await this.beforeDelete(selector);
        if (preparationResult.isFailure) {
            throw preparationResult;
        }

        const result = await this._rest!.delete!(selector);

        const finalizationResult = await this.afterDelete(selector);
        if (finalizationResult.isFailure) {
            throw finalizationResult;
        }

        return result;
    }

    // HOOKS
    private beforeAny = async (): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforeAny !== undefined) {
                const hooked = await extension.beforeAny(this!);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeAny(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    /**
     * Call extensions
     */
    private beforeGet = async (selector: string): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforeGet !== undefined) {
                const hooked = await extension.beforeGet(selector, this!);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    private afterGet = async (selector: string, data?: ReflectDataType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.afterGet !== undefined) {
                const hooked = await extension.afterGet(selector, this!, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterGet(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }

        return OkResult.ok();
    }

    private beforePost = async (selector: string, data: ReflectDataType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforePost !== undefined) {
                const hooked = await extension.beforePost(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePost(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPost = async (selector: string, data: ReflectDataType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.afterPost !== undefined) {
                const hooked = await extension.afterPost(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPost(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforePut = async (selector: string, data: ReflectDataType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforePut !== undefined) {
                const hooked = await extension.beforePut(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePut(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPut = async (selector: string, data?: ReflectDataType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.afterPut !== undefined) {
                const hooked = await extension.afterPut(selector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPut(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforePatch = async <AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforePatch !== undefined) {
                const hooked = await extension.beforePatch(attrSelector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforePatch(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterPatch = async <AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.afterPatch !== undefined) {
                const hooked = await extension.afterPatch(attrSelector, this, data);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterPatch(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private beforeDelete = async (selector: string): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.beforeDelete !== undefined) {
                const hooked = await extension.beforeDelete(selector, this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): beforeDelete(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }

    private afterDelete = async (selector: string): Promise<OkResult> => {
        const memOps = (await this._rest!.getAll!(MEMOP_SELECTOR)).map(node => node.data as ModuleManager);
        for (const extension of memOps) {
            if (extension.afterDelete !== undefined) {
                const hooked = await extension.afterDelete(selector, this);
                if (hooked.isFailure) {
                    return OkResult.fail(`extension('${extension.packageLink}'): afterDelete(): ${hooked.errorTitle}`, hooked.errorDescription!)
                }
            }
        }
        return OkResult.ok();
    }
}