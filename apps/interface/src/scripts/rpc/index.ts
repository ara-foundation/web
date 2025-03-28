/**
 * RPCs are stored in the scripts to avoid
 * collision with the Astro Framework's Actions.
 */

import type { ElementType } from "@scripts/component";
import RedirectComponent from "@components/rpc/extension/redirect.astro"
import AlertComponent from "@components/rpc/extension/alert.astro"

export enum RpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}

export type ExtensionType = {
    name?: string;  // for example redirect
    description?: string; // for example: Redirects to another page
    pageUrl?: string;   // The web page that called the extension
    inputs?: any[];
    slug?: string;
    rpcType?: RpcType.Extension;
}

export type RpcCall = {
    slug: string; // RPC Call
    rpcType: RpcType,
    inputs: any[],
    outputs?: any[],
    component?: ElementType
}

export type InputDescriptions = {
    inputDescriptions: {
        type: string;   // Type of the Input
        description: string; // Explain the input
    }[]
};

export const getRpcs = (): (ExtensionType & InputDescriptions)[] => {
    return [
        {
            name: "Redirect",
            description: "Redirect to the page. Accepts only one parameter which is the url to redirect to",
            slug: "redirect",
            rpcType: RpcType.Extension,
            inputDescriptions: [{
                type: "string",
                description: "The URL to redirect the user"
            }]
        },
        {
            name: "Alert",
            description: "Makes an alert call",
            slug: "alert",
            rpcType: RpcType.Extension,
            inputDescriptions: [{
                type: "string",
                description: "The data to show on the Alert popup. Will be converted into a string"
            }]
        }
    ]
}

// Available RPCs
export const rpcCalls: {[key in RpcType]?: {
    [key: string]: RpcCall}
} = {
    extension: {
        "redirect": {
            slug: "redirect",
            rpcType: RpcType.Extension,
            inputs: [],
            component: RedirectComponent as ElementType
        },
        "alert": {
            slug: "alert",
            rpcType: RpcType.Extension,
            inputs: [],
            component: AlertComponent as ElementType
        }
    }
};