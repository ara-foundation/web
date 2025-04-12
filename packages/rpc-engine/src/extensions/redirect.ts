// Redirect receives one argument.

import { 
    type ExtensionType as GeneralExtensionType, 
    type RpcCallType as GenericRpcCallType,
    RpcType,
    type RPC
} from "../types";

// The url to redirect to
export type ExtensionType = Omit<GeneralExtensionType, 'inputs'> & { inputs: [string] };
export type RpcCallType = Omit<GenericRpcCallType, 'inputs'> & { inputs: [string] }

export const RPCData: RPC = {
    name: "Redirect",
    description: "Redirect to the page. Accepts only one parameter which is the url to redirect to",
    slug: "redirect",
    rpcType: RpcType.Extension,
    componentFilePath: "components/rpc/extension/redirect.astro",
    inputDescriptions: [{
        type: "string",
        description: "The URL to redirect the user"
    }]
}

export const newRpcCall = (): RpcCallType => {
    return {
        slug: "redirect",
        rpcType: RpcType.Extension,
        inputs: [''],
    }
}