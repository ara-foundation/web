import { Debug, Result } from "@ara-web/p-hintjens";
import { ComponentLevel, ElementType, ModuleLink, type Component, type SlotElement, type WalkFilter } from "@ara-web/reflect-astro-ext";
import { ReflectLink } from "@ara-web/reflect/code-level";

export enum RpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}

export type RpcCallType = {
    slug: string; // RPC Call
    rpcType: RpcType,
    inputs: any[],
    outputs?: any[],
}

export const callComponentLink = ModuleLink.newPackageURLFromImportClause("@ara-web/reflect-astro-plugins/components/call.astro");

export class RPCTraits {
    /**
     * If the component is RPC Call, then find out its data by checking the script
     * @param componentNode Component parameter
     * @param astSource If the RPC Call is not a string literal but an expression that is defined in the script, then find 
     * its value from traversing in the AST
     * @returns {RpcCallType|AraLink<Expression code string>}
     */
    public static identifyRpcCallComponent = (component: Component): Result<RpcCallType> => {
        const attrName = "rpcCall";
        if (!(attrName in component.attributes)) {
            return Result.fail(`Attribute '${attrName}' not found`, `Please pass the 'rpcCall' attribute`);
        }

        const attr = component.attributes[attrName];
        if (ReflectLink.isExpressionLink(attr) || ReflectLink.isIdentifierLink(attr)) {
            return Result.fail(`The attribute '${attrName}' is not linted`, `Please lint the attribute first`);
        }

        return Result.ok(attr as RpcCallType);
    }
}


        //         // Let's detect the ComponentType
        //         if (identifiedComponent.id === ComponentIdentity.Undeclared) {
        //             return Result.fail(`code.identifyComponent(componentNode='${componentName(componentNode)}'): error`, 'The component type is not supported by Ara Web')
        //         } else if (identifiedComponent.id === ComponentIdentity.Component || 
        //             identifiedComponent.id === ComponentIdentity.Expression) {
        //             pageTraits.page.metaComponents?.push(identifiedComponent);
        //             continue;
        //         } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
        //             if (pageTraits.page.rpcs === undefined) {
        //                 pageTraits.page.rpcs = {};
        //             }
        //             const componentData = identifiedComponent as RpcCallType;
        //             if (componentData.rpcType === RpcType.Extension) {
        //                 if (pageTraits.page.rpcs.extension === undefined) {
        //                     pageTraits.page.rpcs.extension = [];
        //                 }
        //                 pageTraits.page.rpcs.extension.push(componentData)
        //             } else if (componentData.rpcType === RpcType.Independent) {
        //                 if (pageTraits.page.rpcs.independent === undefined) {
        //                     pageTraits.page.rpcs.independent = [];
        //                 }
        //                 pageTraits.page.rpcs.independent.push(componentData)
        //             } else if (componentData.rpcType === RpcType.Proxy) {
        //                 if (pageTraits.page.rpcs.proxy === undefined) {
        //                     pageTraits.page.rpcs.proxy = [];
        //                 }
        //                 pageTraits.page.rpcs.proxy.push(componentData)
        //             }
        //             continue;
        //         } else if (identifiedComponent.id === ComponentIdentity.Layout) {
        //             const identificationResult = await identifyLayoutComponents(pageTraits, componentNode);
        //             if (identificationResult.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyLayoutComponents(componentNode='${componentName(componentNode)}'): ${identificationResult.errorTitle}`,
        //                     identificationResult.errorDescription!
        //                 )
        //             }
        //             continue;
        //         } else {
        //             console.log(`Component ${componentName(componentNode)} was not identified. It's neither Layout, nor Component nor RPC Call`);
        //         }
