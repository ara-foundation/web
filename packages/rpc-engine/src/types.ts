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
    slug: string;
    rpcType?: RpcType.Extension;
    componentFilePath?: string;
}

export type RpcCallType = {
    slug: string; // RPC Call
    rpcType: RpcType,
    inputs: any[],
    outputs?: any[],
}

export type InputDescriptions = {
    inputDescriptions: {
        type: string;   // Type of the Input
        description: string; // Explain the input
    }[]
};

export type RPC = (ExtensionType & InputDescriptions)

// The RPC Engine exposes a proxy that over-writes the Page
// by adding a new data type: RpcCallType.
// The proxy of Reflect Astro Extension
// sits on any astro extension events. And
// anytime when a user wants to call AstroReflect's data,
// that data is passed by the RPCCallType.