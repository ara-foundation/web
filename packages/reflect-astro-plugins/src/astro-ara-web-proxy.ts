import { OkResult, Debug } from "@ara-web/p-hintjens";
import { SDSProxy } from "@ara-web/p-hintjens/sds";
import type { ProjectMemory } from "@ara-web/reflect";
import { ModuleCategory, ModuleLink, PageLevel, ReflectAstroExtension, type Page as BasePage, type Component } from "@ara-web/reflect-astro-ext";
import { callComponentLink, RPCTraits, type RpcCallType } from "./rpc/index.js";

export type Page = BasePage & {
    rpcs?: RpcCallType[]
}

export class AstroAraWebProxy extends SDSProxy {
    private _behindData?: ReflectAstroExtension;

    constructor() {
        super(
            ModuleLink.newPackageURL("@ara-web", "astro-ara-web-proxy"), 
            ["beforeGet", "afterGet"], 
            "Proxy overwrites the component values"
        );
    }

    public putBehindData?(behindData: ReflectAstroExtension): void {
        this._behindData = behindData;
    }

    public async beforeGet?(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> {
        if (this._behindData === undefined) {
            return OkResult.fail(`The AstroAraWebProxy doesn't have access to ReflectAstroExtension`, `Please, add this as a proxy, and then proxify AstroFramework before using it.`);
        }

        if (this._behindData.beforeGet === undefined) {
            return OkResult.ok();
        }

        const result = await this._behindData.beforeGet(moduleCategory, projectMemory);
        if (result.isFailure) {
            return OkResult.fail(`ReflectAstroExtension.beforeGet('${moduleCategory}'): ${result.errorTitle}`, result.errorDescription!);
        }

        const identified = await this.identifyRpcCalls(moduleCategory, projectMemory);
        if (identified.isFailure) {
            return OkResult.fail(`this.identifyRpcCalls('${moduleCategory}'): ${identified.errorTitle}`, identified.errorDescription!);
        }

        return OkResult.fail("not implemented yet", "")
    }
   
    private async identifyRpcCalls(moduleCategory: string, projectMemory: ProjectMemory): Promise<OkResult> {
        if (moduleCategory !== ModuleCategory.Page) {
            return OkResult.ok();
        }

        const modules = this._behindData?.getModules(moduleCategory);
        if (modules === undefined || modules.length === 0) {
            return OkResult.ok();
        }

        for (const moduleIndex in modules) {
            const module = modules[moduleIndex];
            if (module.content === undefined) {
                continue;
            }

            // Iterate recursively, using REST page walker.
            // It should be a generic function.
            const pageRest = PageLevel.rest(module.content as Page);
            const rpcCallComponentObj = pageRest.get!(`[componentClass="${callComponentLink.moduleURL}"]`);
            Debug.log(`The RPC Call component Obj:`)
            Debug.log(rpcCallComponentObj);
            if (rpcCallComponentObj === null) {
                continue;
            }
            const rpcCallComponent = rpcCallComponentObj.getElement()!;

            Debug.log(`RPC Call was identified. The RPC Call link: ${rpcCallComponent.link}`);
            const rpcCall = RPCTraits.identifyRpcCallComponent(rpcCallComponent as Component);
            if (rpcCall.isFailure) {
                return OkResult.fail(`module('${module.moduleLink}'): RPCTraits.identifyRpcCallComponent('${rpcCallComponent.link}'): ${rpcCall.errorTitle}`, rpcCall.errorDescription!);
            }
            Debug.log(`TODO: identifyRpcCalls should call PHintjens.objectRest.delete(selector, SlotWalker)`)
        }
     
        return OkResult.fail("not implemented yet", "")
    }

    public async afterGet?(moduleCategory: ModuleCategory, _: ProjectMemory): Promise<OkResult> {
        return OkResult.fail(`The afterGet not yet supported`, `Please update @ara-web/astro-ara-web-services to work with '${moduleCategory}'`);
    }
}