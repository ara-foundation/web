// Redirect receives one argument.

import { 
    type ExtensionType as GeneralExtensionType, 
    type RpcCallType as GenericRpcCallType,
    RpcType,
    type RPC
} from "../types.js";

// The url to redirect to
export type ExtensionType = Omit<GeneralExtensionType, 'inputs'> & { inputs: [string] };
export type RpcCallType = Omit<GenericRpcCallType, 'inputs'> & { inputs: [string] }

export const RPCData: RPC = {
    name: "Alert",
    description: "Makes an alert call",
    slug: "alert",
    rpcType: RpcType.Extension,
    componentFilePath: "components/rpc/extension/alert.astro",
    inputDescriptions: [{
        type: "string",
        description: "The URL to redirect the user"
    }]
}

export const newRpcCall = (): RpcCallType => {
    return {
        slug: "alert",
        rpcType: RpcType.Extension,
        inputs: [''],
    }
}