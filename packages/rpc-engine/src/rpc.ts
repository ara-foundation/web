/**
 * RPCs are stored in the scripts to avoid
 * collision with the Astro Framework's Actions.
 */
import {
    RpcType,
    type RpcCallType,
    type RPC
} from "./types"
import { 
    RPCData as redirectData,
    newRpcCall as redirectCall,
 } from "./extensions/redirect"
import { 
    RPCData as alertData,
    newRpcCall as alertCall,
} from "./extensions/alert"

const CallComponentPath = "components/rpc/call.astro";

export const getRpcs = (): RPC[] => {
    return [
        redirectData,
        alertData,
    ]
}

export const rpcBySlug = (slug: string): RPC|undefined => {
    const rpcs = getRpcs();
    for (const rpc of rpcs) {
        if (rpc.slug === slug) {
            return rpc;
        }
    }

    return undefined;
}

export const isRpcComponent = (filePath: string): boolean => {
    return (filePath.indexOf(CallComponentPath) > -1);
}
 
export const rpcByComponentFilePath = (filePath: string): RPC|undefined => {
    const rpcs = getRpcs();
    for (const rpc of rpcs) {
        if (rpc.componentFilePath !== undefined && filePath.indexOf(rpc.componentFilePath) > -1) {
            return rpc;
        }
    }

    return undefined;
}

// Available RPCs
export const rpcCalls = (): {[key in RpcType]?: {
    [key: string]: RpcCallType}
} => { 
    return {
        extension: {
            [redirectData.slug]: redirectCall(),
            [alertData.slug]: alertCall(),
        }
    }
};
